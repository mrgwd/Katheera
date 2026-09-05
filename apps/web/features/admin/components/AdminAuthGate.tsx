"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";

interface AdminAuthGateProps {
  secret: string;
  error: string | null;
  onSecretChange: (value: string) => void;
  onSignIn: () => void;
}

export function AdminAuthGate({
  secret,
  error,
  onSecretChange,
  onSignIn,
}: AdminAuthGateProps) {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Admin — Contribution Review</CardTitle>
          <CardDescription>
            Enter the admin secret to review submitted audio samples.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="password"
            placeholder="Admin secret"
            value={secret}
            onChange={(e) => onSecretChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSignIn();
            }}
            className="h-auto! px-4! py-2.5!"
          />
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button className="w-full" onClick={onSignIn}>
            Sign in
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
