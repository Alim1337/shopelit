"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type Status = "loading" | "success" | "error" | "missing";

const linkButton =
  "inline-flex h-10 w-full items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white transition-colors hover:bg-indigo-700";

export default function VerifyEmailClient({ token }: { token: string }) {
  const [status, setStatus] = useState<Status>(token ? "loading" : "missing");
  const [message, setMessage] = useState("");
  // React StrictMode runs effects twice in dev; the token can only be used once
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setStatus("success");
        } else {
          setMessage(data.error || data.message || "");
          setStatus("error");
        }
      })
      .catch(() => {
        setMessage("Something went wrong. Please try again.");
        setStatus("error");
      });
  }, [token]);

  return (
    <Card>
      <CardHeader className="items-center text-center">
        {status === "loading" && <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />}
        {status === "success" && <CheckCircle2 className="h-10 w-10 text-emerald-600" />}
        {(status === "error" || status === "missing") && <XCircle className="h-10 w-10 text-red-500" />}

        <CardTitle className="text-2xl">
          {status === "loading" && "Verifying your email…"}
          {status === "success" && "Email verified"}
          {status === "error" && "Verification failed"}
          {status === "missing" && "Invalid link"}
        </CardTitle>
        <CardDescription>
          {status === "loading" && "Just a moment."}
          {status === "success" && "Thanks! Your email address is now confirmed."}
          {status === "error" &&
            (message || "This link is invalid, expired or already used.")}
          {status === "missing" && "This verification link is incomplete. Please use the link from your email."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {status === "success" && (
          <Link href="/" className={linkButton}>
            Continue shopping
          </Link>
        )}
        {(status === "error" || status === "missing") && (
          <>
            <p className="text-center text-sm text-slate-500">
              You can request a new link from your account page.
            </p>
            <Link href="/account" className={linkButton}>
              Go to my account
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
