export function epochTimestampInSecToDate(timestamp: bigint): string {
    const date = new Date(Number(timestamp) * 1000);
    return date.toUTCString(); // Format as UTC string
}
