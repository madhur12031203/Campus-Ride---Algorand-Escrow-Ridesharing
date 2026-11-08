/** Frontend settlement is intentionally disabled until it calls the ARC-4
 * contract methods and verifies their confirmations. Never invent transaction IDs.
 */
export const ESCROW_PAYMENTS_ENABLED = false;
const unavailable = "Escrow payments are not available yet. Contract integration is required; no funds were moved.";
export function convertFareToMicroAlgos(fare: number): number {
  if (!Number.isFinite(fare) || fare < 0) throw new Error("Invalid fare");
  return Math.max(1_000, Math.round(fare * 1_000));
}
export async function sendEscrowPayment(input: { senderAddress: string; appAddress: string; fare: number }): Promise<string> {
  void input;
  throw new Error(unavailable);
}
export async function releaseEscrowPayment(input: { appAddress: string; driverAddress: string; rideId: string }): Promise<string> {
  void input;
  throw new Error(unavailable);
}
