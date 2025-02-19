# Getter Functions Implementation Guide

Getter functions retrieve data from the blockchain or protocols. They **do not** perform transactions and **do not** use the `sign` function.

## Guidelines

1. **Function and File Naming**

   - The function name must match the file name.
   - One function per file in the `functions/` directory.

2. **Input Validation**

   - Validate input arguments at the beginning.
   - Return informative error messages using `toResult`.

3. **Data Limits**

   - Do not return more than **500 tokens** of data.
   - Split functions into smaller ones if retrieving large amounts of data.

4. **Returning Results**

   - Always use `toResult` to return data.
   - Ensure data is formatted and parsed appropriately.

5. **Comments and Documentation**

   - Include JSDoc comments.
   - Explain any complex logic.

## Example: `getUserPositionOnSKY`

[See the code in the [Getter Function Example](getter-function-example.md).
