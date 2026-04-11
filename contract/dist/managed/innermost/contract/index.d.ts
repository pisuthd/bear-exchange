import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  localSk(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  askSk(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  witDivide(context: __compactRuntime.WitnessContext<Ledger, PS>,
            numerator_0: bigint,
            denominator_0: bigint): [PS, bigint];
}

export type ImpureCircuits<PS> = {
  mintUSD(context: __compactRuntime.CircuitContext<PS>,
          amount_0: bigint,
          recipient_0: { is_left: boolean,
                         left: { bytes: Uint8Array },
                         right: { bytes: Uint8Array }
                       },
          nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  mintEUR(context: __compactRuntime.CircuitContext<PS>,
          amount_0: bigint,
          recipient_0: { is_left: boolean,
                         left: { bytes: Uint8Array },
                         right: { bytes: Uint8Array }
                       },
          nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  mintJPY(context: __compactRuntime.CircuitContext<PS>,
          amount_0: bigint,
          recipient_0: { is_left: boolean,
                         left: { bytes: Uint8Array },
                         right: { bytes: Uint8Array }
                       },
          nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  createOrder(context: __compactRuntime.CircuitContext<PS>,
              pair_0: Uint8Array,
              direction_0: Uint8Array,
              price_0: bigint,
              amount_0: bigint,
              nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  batchCreateOrders2(context: __compactRuntime.CircuitContext<PS>,
                     pair1_0: Uint8Array,
                     direction1_0: Uint8Array,
                     price1_0: bigint,
                     amount1_0: bigint,
                     nonce1_0: Uint8Array,
                     pair2_0: Uint8Array,
                     direction2_0: Uint8Array,
                     price2_0: bigint,
                     amount2_0: bigint,
                     nonce2_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  batchCreateOrders4(context: __compactRuntime.CircuitContext<PS>,
                     pair1_0: Uint8Array,
                     direction1_0: Uint8Array,
                     price1_0: bigint,
                     amount1_0: bigint,
                     nonce1_0: Uint8Array,
                     pair2_0: Uint8Array,
                     direction2_0: Uint8Array,
                     price2_0: bigint,
                     amount2_0: bigint,
                     nonce2_0: Uint8Array,
                     pair3_0: Uint8Array,
                     direction3_0: Uint8Array,
                     price3_0: bigint,
                     amount3_0: bigint,
                     nonce3_0: Uint8Array,
                     pair4_0: Uint8Array,
                     direction4_0: Uint8Array,
                     price4_0: bigint,
                     amount4_0: bigint,
                     nonce4_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  cancelOrder(context: __compactRuntime.CircuitContext<PS>,
              orderId_0: Uint8Array,
              pair_0: Uint8Array,
              direction_0: Uint8Array,
              price_0: bigint,
              amount_0: bigint,
              nonce_0: Uint8Array,
              refundNonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  matchOrders(context: __compactRuntime.CircuitContext<PS>,
              bidOrderId_0: Uint8Array,
              askOrderId_0: Uint8Array,
              matchAmount_0: bigint,
              bidPair_0: Uint8Array,
              bidPrice_0: bigint,
              bidAmount_0: bigint,
              bidNonce_0: Uint8Array,
              askPair_0: Uint8Array,
              askPrice_0: bigint,
              askAmount_0: bigint,
              askNonce_0: Uint8Array,
              bidRemainderNonce_0: Uint8Array,
              askRemainderNonce_0: Uint8Array,
              settlementNonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  mintUSD(context: __compactRuntime.CircuitContext<PS>,
          amount_0: bigint,
          recipient_0: { is_left: boolean,
                         left: { bytes: Uint8Array },
                         right: { bytes: Uint8Array }
                       },
          nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  mintEUR(context: __compactRuntime.CircuitContext<PS>,
          amount_0: bigint,
          recipient_0: { is_left: boolean,
                         left: { bytes: Uint8Array },
                         right: { bytes: Uint8Array }
                       },
          nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  mintJPY(context: __compactRuntime.CircuitContext<PS>,
          amount_0: bigint,
          recipient_0: { is_left: boolean,
                         left: { bytes: Uint8Array },
                         right: { bytes: Uint8Array }
                       },
          nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  createOrder(context: __compactRuntime.CircuitContext<PS>,
              pair_0: Uint8Array,
              direction_0: Uint8Array,
              price_0: bigint,
              amount_0: bigint,
              nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  batchCreateOrders2(context: __compactRuntime.CircuitContext<PS>,
                     pair1_0: Uint8Array,
                     direction1_0: Uint8Array,
                     price1_0: bigint,
                     amount1_0: bigint,
                     nonce1_0: Uint8Array,
                     pair2_0: Uint8Array,
                     direction2_0: Uint8Array,
                     price2_0: bigint,
                     amount2_0: bigint,
                     nonce2_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  batchCreateOrders4(context: __compactRuntime.CircuitContext<PS>,
                     pair1_0: Uint8Array,
                     direction1_0: Uint8Array,
                     price1_0: bigint,
                     amount1_0: bigint,
                     nonce1_0: Uint8Array,
                     pair2_0: Uint8Array,
                     direction2_0: Uint8Array,
                     price2_0: bigint,
                     amount2_0: bigint,
                     nonce2_0: Uint8Array,
                     pair3_0: Uint8Array,
                     direction3_0: Uint8Array,
                     price3_0: bigint,
                     amount3_0: bigint,
                     nonce3_0: Uint8Array,
                     pair4_0: Uint8Array,
                     direction4_0: Uint8Array,
                     price4_0: bigint,
                     amount4_0: bigint,
                     nonce4_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  cancelOrder(context: __compactRuntime.CircuitContext<PS>,
              orderId_0: Uint8Array,
              pair_0: Uint8Array,
              direction_0: Uint8Array,
              price_0: bigint,
              amount_0: bigint,
              nonce_0: Uint8Array,
              refundNonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  matchOrders(context: __compactRuntime.CircuitContext<PS>,
              bidOrderId_0: Uint8Array,
              askOrderId_0: Uint8Array,
              matchAmount_0: bigint,
              bidPair_0: Uint8Array,
              bidPrice_0: bigint,
              bidAmount_0: bigint,
              bidNonce_0: Uint8Array,
              askPair_0: Uint8Array,
              askPrice_0: bigint,
              askAmount_0: bigint,
              askNonce_0: Uint8Array,
              bidRemainderNonce_0: Uint8Array,
              askRemainderNonce_0: Uint8Array,
              settlementNonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
  getDappPubKey(sk_0: Uint8Array): Uint8Array;
}

export type Circuits<PS> = {
  getDappPubKey(context: __compactRuntime.CircuitContext<PS>, sk_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  mintUSD(context: __compactRuntime.CircuitContext<PS>,
          amount_0: bigint,
          recipient_0: { is_left: boolean,
                         left: { bytes: Uint8Array },
                         right: { bytes: Uint8Array }
                       },
          nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  mintEUR(context: __compactRuntime.CircuitContext<PS>,
          amount_0: bigint,
          recipient_0: { is_left: boolean,
                         left: { bytes: Uint8Array },
                         right: { bytes: Uint8Array }
                       },
          nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  mintJPY(context: __compactRuntime.CircuitContext<PS>,
          amount_0: bigint,
          recipient_0: { is_left: boolean,
                         left: { bytes: Uint8Array },
                         right: { bytes: Uint8Array }
                       },
          nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  createOrder(context: __compactRuntime.CircuitContext<PS>,
              pair_0: Uint8Array,
              direction_0: Uint8Array,
              price_0: bigint,
              amount_0: bigint,
              nonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  batchCreateOrders2(context: __compactRuntime.CircuitContext<PS>,
                     pair1_0: Uint8Array,
                     direction1_0: Uint8Array,
                     price1_0: bigint,
                     amount1_0: bigint,
                     nonce1_0: Uint8Array,
                     pair2_0: Uint8Array,
                     direction2_0: Uint8Array,
                     price2_0: bigint,
                     amount2_0: bigint,
                     nonce2_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  batchCreateOrders4(context: __compactRuntime.CircuitContext<PS>,
                     pair1_0: Uint8Array,
                     direction1_0: Uint8Array,
                     price1_0: bigint,
                     amount1_0: bigint,
                     nonce1_0: Uint8Array,
                     pair2_0: Uint8Array,
                     direction2_0: Uint8Array,
                     price2_0: bigint,
                     amount2_0: bigint,
                     nonce2_0: Uint8Array,
                     pair3_0: Uint8Array,
                     direction3_0: Uint8Array,
                     price3_0: bigint,
                     amount3_0: bigint,
                     nonce3_0: Uint8Array,
                     pair4_0: Uint8Array,
                     direction4_0: Uint8Array,
                     price4_0: bigint,
                     amount4_0: bigint,
                     nonce4_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  cancelOrder(context: __compactRuntime.CircuitContext<PS>,
              orderId_0: Uint8Array,
              pair_0: Uint8Array,
              direction_0: Uint8Array,
              price_0: bigint,
              amount_0: bigint,
              nonce_0: Uint8Array,
              refundNonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  matchOrders(context: __compactRuntime.CircuitContext<PS>,
              bidOrderId_0: Uint8Array,
              askOrderId_0: Uint8Array,
              matchAmount_0: bigint,
              bidPair_0: Uint8Array,
              bidPrice_0: bigint,
              bidAmount_0: bigint,
              bidNonce_0: Uint8Array,
              askPair_0: Uint8Array,
              askPrice_0: bigint,
              askAmount_0: bigint,
              askNonce_0: Uint8Array,
              bidRemainderNonce_0: Uint8Array,
              askRemainderNonce_0: Uint8Array,
              settlementNonce_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  readonly nextOrderId: bigint;
  readonly nextTradeId: bigint;
  orderCommitment: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): Uint8Array;
    [Symbol.iterator](): Iterator<[Uint8Array, Uint8Array]>
  };
  nullifierSet: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<[Uint8Array, boolean]>
  };
  readonly owner: Uint8Array;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
