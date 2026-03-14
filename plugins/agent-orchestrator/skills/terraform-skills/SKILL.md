---
name: terraform-skills
description: Write Terraform infrastructure-as-code — modules, providers, state management, workspaces, and security. Use when the user mentions "Terraform", "IaC", "infrastructure as code", "cloud provisioning", or needs to manage cloud resources declaratively.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Terraform Skills

Infrastructure as Code with HashiCorp Terraform.

## Module Template
```hcl
# modules/vpc/main.tf
resource "aws_vpc" "main" {
  cidr_block           = var.cidr_block
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(var.tags, { Name = "${var.project}-vpc" })
}

resource "aws_subnet" "public" {
  count             = length(var.public_subnets)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.public_subnets[count.index]
  availability_zone = var.azs[count.index]
  
  tags = merge(var.tags, { Name = "${var.project}-public-${count.index}" })
}

# modules/vpc/variables.tf
variable "project" { type = string }
variable "cidr_block" { type = string, default = "10.0.0.0/16" }
variable "public_subnets" { type = list(string) }
variable "azs" { type = list(string) }
variable "tags" { type = map(string), default = {} }

# modules/vpc/outputs.tf
output "vpc_id" { value = aws_vpc.main.id }
output "public_subnet_ids" { value = aws_subnet.public[*].id }
```
