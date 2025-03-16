-- Create enum for refund request status
CREATE TYPE refund_request_status AS ENUM ('pending', 'approved', 'rejected', 'processed');

-- Create refund_requests table
CREATE TABLE "public"."refund_requests" (
    "refund_request_id" bigserial PRIMARY KEY,
    "ticket_order_id" text NOT NULL,
    "student_id" uuid NOT NULL REFERENCES "public"."students"("student_id"),
    "event_id" bigint NOT NULL REFERENCES "public"."events"("event_id"),
    "reason" text NOT NULL,
    "status" refund_request_status NOT NULL DEFAULT 'pending',
    "ticket_service" text NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE "public"."refund_requests" ENABLE ROW LEVEL SECURITY;

-- Policy for students to view their own refund requests
CREATE POLICY "Students can view their own refund requests"
    ON "public"."refund_requests"
    FOR SELECT
    TO authenticated
    USING (auth.uid() = student_id);

-- Policy for students to create refund requests
CREATE POLICY "Students can create refund requests"
    ON "public"."refund_requests"
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = student_id);

-- Policy for admins to view all refund requests
CREATE POLICY "Admins can view all refund requests"
    ON "public"."refund_requests"
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE admin_id = auth.uid()
        )
    );

-- Add updated_at trigger
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON "public"."refund_requests"
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at(); 