"use client";

import { useEffect, useState, type SubmitEvent } from "react";
import { RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuth } from "../hooks/use-auth";

interface InputOTPFormProps {
  email: string;
  onSuccess: () => void;
}

export function InputOTPForm({ email, onSuccess }: InputOTPFormProps) {
  const { error, isLoading, resendVerification, verifyEmail } = useAuth();
  const [code, setCode] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    if (resendIn === 0) return;
    const timer = window.setInterval(() => {
      setResendIn((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendIn]);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (code.length !== 6) return;

    const verified = await verifyEmail(email, code);
    if (verified) onSuccess();
  }

  async function handleResend() {
    if (resendIn > 0 || isLoading) return;

    setResendMessage(null);
    const response = await resendVerification(email);
    if (response.success) {
      setCode("");
      setResendIn(60);
      setResendMessage(response.message ?? "A new code was sent.");
    } else {
      setResendMessage(response.message ?? "Unable to resend the code.");
    }
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Verify your email</CardTitle>
        <CardDescription>
          Enter the 6-digit code sent to{" "}
          <span className="font-medium">{email}</span>.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <Field>
            <div className="flex items-center justify-between gap-3">
              <FieldLabel htmlFor="otp-verification">
                Verification code
              </FieldLabel>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={handleResend}
                disabled={resendIn > 0 || isLoading}
              >
                <RefreshCwIcon />
                {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
              </Button>
            </div>
            <InputOTP
              maxLength={6}
              id="otp-verification"
              value={code}
              onChange={setCode}
              disabled={isLoading}
              required
              aria-invalid={Boolean(error)}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator className="mx-2" />
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <FieldDescription>
              We never ask for this code anywhere except this verification form.
            </FieldDescription>
            {(error || resendMessage) && (
              <p
                role={error ? "alert" : "status"}
                className={`text-sm ${
                  error ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                }`}
              >
                {error ?? resendMessage}
              </p>
            )}
          </Field>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={code.length !== 6 || isLoading}
          >
            {isLoading ? "Verifying..." : "Verify email"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
