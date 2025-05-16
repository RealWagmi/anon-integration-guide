  if (result !== undefined) {
    console.log("\nFunction Result:");
    // Handle BigInts in the result for proper JSON stringification
    const replacer = (key: any, value: any) =>
      typeof value === "bigint" ? value.toString() : value;
    console.log(JSON.stringify(result, replacer, 2));
  } 