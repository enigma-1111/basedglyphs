import { COLLECTION, OTHER_COLLECTIONS_ENABLED } from "@/lib/collection";
import { EXAMPLE_LABEL, EXAMPLE_WALLET } from "@/lib/treasury";

/** The only collection buried in this version. */
export const BURIAL_NOW = {
  name: COLLECTION.name,
  contract: COLLECTION.contract,
  wallet: EXAMPLE_WALLET,
  walletLabel: EXAMPLE_LABEL,
} as const;

/**
 * Later expeditions can bury other collections held by BURIAL_NOW.wallet.
 * When that ships, claim keys should be `contract:tokenId` so two collections
 * cannot collide. Do not build the picker yet.
 */
export const BURIAL_LATER = {
  id: "wallet-collections",
  label: "Other collections in this wallet",
  wallet: EXAMPLE_WALLET,
  enabled: OTHER_COLLECTIONS_ENABLED,
} as const;
