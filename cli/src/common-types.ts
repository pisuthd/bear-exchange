  // This file is part of bear-exchange.
  // SPDX-License-Identifier: Apache-2.0

  import type { MidnightProviders } from '@midnight-ntwrk/midnight-js/types';
  import type { DeployedContract, FoundContract } from '@midnight-ntwrk/midnight-js/contracts';
  import type { ProvableCircuitId } from '@midnight-ntwrk/compact-js';
  import { Contract, ledger, type Ledger } from '../../contract/src/managed/beardex/contract/index.js';
  import type { BearDEXPrivateState as WitnessBearDEXPrivateState } from './witnesses.js';

  // Import private state type from witnesses
  export type BearDEXPrivateState = WitnessBearDEXPrivateState;

export type BearDEXCircuits = ProvableCircuitId<Contract<BearDEXPrivateState>>;

export const BearDEXPrivateStateId = 'beardexPrivateState';

export type BearDEXProviders = MidnightProviders<BearDEXCircuits, typeof BearDEXPrivateStateId, BearDEXPrivateState>;

export type BearDEXContract = Contract<BearDEXPrivateState>;

export type DeployedBearDEXContract = DeployedContract<BearDEXContract> | FoundContract<BearDEXContract>;

// Helper to get ledger state from contract
export { ledger };

export type BearDEXLedger = Ledger;