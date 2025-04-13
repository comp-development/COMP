ALTER ROLE authenticator SET pgrst.db_aggregates_enabled = 'true';
NOTIFY pgrst, 'reload config';

ALTER USER authenticator SET plan_filter.statement_cost_limit = 1e7;
