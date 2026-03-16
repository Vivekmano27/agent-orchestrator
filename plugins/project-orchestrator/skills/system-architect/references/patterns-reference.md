# Architecture Patterns Reference

## Clean Architecture Layers
```
Presentation → Application → Domain → Infrastructure
     ↓              ↓           ↓            ↓
  Controllers    Use Cases   Entities    Repositories
  Views          DTOs        Value Obj   External APIs
  Routes         Services    Events      Database
```

**Rule:** Dependencies point inward. Domain never depends on infrastructure.

## Monolith to Microservices Migration Path
1. Start with modular monolith (clear module boundaries)
2. Extract shared libraries first
3. Identify bounded contexts via domain analysis
4. Extract highest-value service first (usually auth or payments)
5. Add API gateway for routing
6. Migrate one service at a time

## Common Mistakes
- Over-engineering: Don't use microservices for a 3-person team
- Under-defining boundaries: "Shared database" between services = distributed monolith
- Ignoring data ownership: Each service should own its data
- Premature optimization: Profile before you optimize
