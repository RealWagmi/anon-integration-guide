# Architecture and Design

## Overview

The system follows a modular architecture where each protocol integration is implemented as a separate module. This design ensures:

- Isolation of protocol-specific code
- Easy maintenance and updates
- Independent deployment capabilities
- Clear separation of concerns

## Module Structure

Each module (protocol) must follow this minimal structure:

```
your-module/
├── src/
│   ├── functions/
│   │   ├── index.ts
│   │   ├── your-function.ts
│   ├── constants.ts
│   ├── types.ts
│   ├── tools.ts
│   └── helpers/
│       └── utils.ts
├── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

### Directory Purpose

1. **`functions/`**: Core implementation

   - One function per file
   - Clear single responsibility
   - Standardized error handling
   - Example: `depositTokens.ts`, `withdrawTokens.ts`

2. **Root Files**:
   - `tools.ts`: LLM function definitions
   - `index.ts`: Public module API
   - `README.md`: Documentation and examples

## Common Practices

- **Single Responsibility**: Each function should have a single purpose.
- **Consistency**: Follow the same patterns and structures as existing modules.
- **Reusability**: Utilize shared utilities and types to avoid duplication.
- **Error Handling**: Centralize error handling using `toResult` and consistent messaging.
