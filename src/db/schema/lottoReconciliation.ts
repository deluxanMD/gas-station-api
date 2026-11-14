import { LossAttribution } from '@/constants/lottoReconciliation.constants';

const attributions = Object.values(LossAttribution)
  .map((value) => `'${value}'`)
  .join(', ');

// One reconciliation per manager shift. Amounts are whole cents; the nets and the
// total can be negative. The nets are the figures the manager saw, taken from the
// scratch ticket and lotto report steps, so the over/short stays explainable.
export const lottoReconciliationTable = `
  CREATE TABLE IF NOT EXISTS lotto_reconciliation (
    id                INTEGER     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    shift_id          INTEGER     NOT NULL REFERENCES shift (id),
    user_id           INTEGER     NOT NULL REFERENCES users (id),
    bullock           INTEGER     NOT NULL CHECK (bullock >= 0),
    bull_payouts      INTEGER     NOT NULL CHECK (bull_payouts >= 0),
    bull_lotto_winner INTEGER     NOT NULL CHECK (bull_lotto_winner >= 0),
    lotto_net         INTEGER     NOT NULL,
    redeem_net        INTEGER     NOT NULL,
    activations_net   INTEGER     NOT NULL,
    cash_net          INTEGER     NOT NULL,
    total             INTEGER     NOT NULL,
    attribution       VARCHAR(20) CHECK (attribution IN (${attributions})),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ,
    updated_by        VARCHAR(50),
    CHECK (total = lotto_net + redeem_net + activations_net + cash_net)
  )
`;

// A repeated submission is rejected instead of duplicating the reconciliation.
export const lottoReconciliationShiftIndex = `
  CREATE UNIQUE INDEX IF NOT EXISTS lotto_reconciliation_one_per_shift
  ON lotto_reconciliation (shift_id)
`;
