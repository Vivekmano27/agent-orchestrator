---
name: terraform-skills
description: Write Terraform infrastructure-as-code — modules, providers, state management, workspaces, and security. Use when the user mentions "Terraform", "IaC", "infrastructure as code", "cloud provisioning", or needs to manage cloud resources declaratively.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Terraform Skills

## Output Structure

Every Terraform module must produce this file layout. Do not put all resources in a single file.

```
infrastructure/
├── main.tf              # Provider config, backend, module calls
├── variables.tf         # Root-level input variables
├── outputs.tf           # Root-level outputs
├── terraform.tfvars     # Default values (NEVER commit secrets here)
├── environments/
│   ├── dev.tfvars
│   ├── staging.tfvars
│   └── prod.tfvars
└── modules/
    └── <module-name>/
        ├── main.tf      # Resources
        ├── variables.tf # Module inputs with validation blocks
        ├── outputs.tf   # Module outputs
        └── versions.tf  # Required providers and terraform version
```

## State Backend Configuration

Always configure remote state with locking. Never use local state for shared infrastructure.

```hcl
# main.tf — backend config
terraform {
  required_version = ">= 1.5.0"

  backend "s3" {
    bucket         = "myproject-terraform-state"
    key            = "infrastructure/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
```

### State Lock Table (bootstrap this manually or via a separate config)

```hcl
resource "aws_dynamodb_table" "terraform_lock" {
  name         = "terraform-state-lock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}
```

## VPC + Subnets Module (Reference Pattern)

```hcl
# modules/vpc/main.tf
resource "aws_vpc" "main" {
  cidr_block           = var.cidr_block
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = { Name = "${var.project}-${var.environment}-vpc" }
}

resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.azs[count.index]
  map_public_ip_on_launch = true

  tags = { Name = "${var.project}-public-${var.azs[count.index]}" }
}

resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.azs[count.index]

  tags = { Name = "${var.project}-private-${var.azs[count.index]}" }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.project}-igw" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = { Name = "${var.project}-public-rt" }
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}
```

```hcl
# modules/vpc/variables.tf
variable "project" {
  type        = string
  description = "Project name, used in resource naming"
}

variable "environment" {
  type        = string
  description = "Environment (dev, staging, prod)"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "cidr_block" {
  type        = string
  default     = "10.0.0.0/16"
  description = "VPC CIDR block"

  validation {
    condition     = can(cidrhost(var.cidr_block, 0))
    error_message = "cidr_block must be a valid CIDR notation (e.g., 10.0.0.0/16)."
  }
}

variable "public_subnet_cidrs" {
  type        = list(string)
  description = "CIDR blocks for public subnets (one per AZ)"

  validation {
    condition     = length(var.public_subnet_cidrs) >= 2
    error_message = "At least 2 public subnets required for high availability."
  }
}

variable "private_subnet_cidrs" {
  type        = list(string)
  description = "CIDR blocks for private subnets (one per AZ)"

  validation {
    condition     = length(var.private_subnet_cidrs) >= 2
    error_message = "At least 2 private subnets required for high availability."
  }
}

variable "azs" {
  type        = list(string)
  description = "Availability zones to use"

  validation {
    condition     = length(var.azs) >= 2
    error_message = "At least 2 AZs required for high availability."
  }
}
```

```hcl
# modules/vpc/outputs.tf
output "vpc_id" {
  value       = aws_vpc.main.id
  description = "VPC ID"
}

output "public_subnet_ids" {
  value       = aws_subnet.public[*].id
  description = "List of public subnet IDs"
}

output "private_subnet_ids" {
  value       = aws_subnet.private[*].id
  description = "List of private subnet IDs"
}

output "vpc_cidr_block" {
  value       = aws_vpc.main.cidr_block
  description = "VPC CIDR block for security group rules"
}
```

## Constraints

1. **Every variable must have a `description`.** Variables without descriptions cause `terraform-docs` to produce useless output.
2. **Use `validation` blocks** for any variable with a constrained domain (environment names, CIDR blocks, instance types, region names). This catches typos at `plan` time instead of `apply` time.
3. **Never hardcode AMI IDs, account IDs, or region names** in resource blocks. Use variables or data sources (`data.aws_ami`, `data.aws_caller_identity`).
4. **Tag every resource** with at least `Project`, `Environment`, and `ManagedBy = "terraform"`. Use the provider `default_tags` block shown above so individual resources inherit automatically.
5. **Pin provider versions** with `~>` pessimistic constraint (e.g., `~> 5.0`). Never use `>=` without an upper bound in production.
6. **Never output secrets.** If a resource produces a sensitive value (e.g., RDS password), mark the output with `sensitive = true`.

## Workflow Commands Reference

```bash
# Initialize (download providers, configure backend)
terraform init

# Format all .tf files (enforced in CI)
terraform fmt -recursive

# Validate syntax and types
terraform validate

# Plan against a specific environment
terraform plan -var-file=environments/prod.tfvars -out=plan.tfplan

# Apply a saved plan (never apply without a plan file in production)
terraform apply plan.tfplan

# Import existing resources into state
terraform import aws_vpc.main vpc-abc123

# Destroy (requires explicit approval)
terraform destroy -var-file=environments/dev.tfvars
```

## Anti-Patterns

- **No remote state** — using local state files; state must be in S3/GCS with locking (DynamoDB/GCS) for team collaboration
- **Hardcoded values** — putting region, account IDs, or secrets directly in .tf files; use variables and tfvars
- **No state locking** — two developers running apply simultaneously corrupt state; always enable locking
- **Giant monolithic config** — all resources in one main.tf; split into modules by service/concern
- **No plan before apply** — running terraform apply without reviewing the plan; always plan first
- **Committed tfstate** — state files in git expose secrets; use remote backend and .gitignore

## Checklist

- [ ] Remote state backend configured with locking
- [ ] Resources organized into reusable modules
- [ ] Variables defined for all environment-specific values
- [ ] Separate tfvars per environment (dev, staging, prod)
- [ ] State files excluded from git (.gitignore)
- [ ] terraform plan reviewed before every apply
- [ ] Sensitive outputs marked with sensitive = true
- [ ] Provider versions pinned in required_providers block
