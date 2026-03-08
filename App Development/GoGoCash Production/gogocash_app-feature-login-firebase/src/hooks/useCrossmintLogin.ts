"use client";
import { ResponseWithdrawCheck } from "@/interfaces/withdraw";
import { fetcherPost } from "@/lib/axios/client";
import { useSafeAuth, useSafeWallet } from "./useSafeCrossmint";
import { useQuery } from "@tanstack/react-query";
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useState, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { setPendingAuthIntent, track } from "@/lib/analytics";

interface LoginState {
  isLoggingIn: boolean;
  hasAttemptedLogin: boolean;
  error: string | null;
  retryCount: number;
}

const useCrossmintLogin = () => {
  const crossmintAuth = useSafeAuth();
  const { user, jwt, status: statusAuth } = crossmintAuth;
  const crossmintWallet = useSafeWallet();
  const { wallet, status } = crossmintWallet;
  const [isMounted, setIsMounted] = useState<boolean>();
  const loginAttemptRef = useRef(false);
  const { data: session } = useSession();
  
  // Get referral_id safely without useSearchParams to avoid Suspense issues
  const [referral_id, setReferralId] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    // Access search params on client side only, after mount
    if (typeof window !== 'undefined') {
      setIsMounted(true);
      const params = new URLSearchParams(window.location.search);
      const id = params.get("referral_id");
      if (id) {
        setReferralId(id);
      }
    }
  }, []);
  
  const maxRetries = 3;

  const [loginState, setLoginState] = useState<LoginState>({
    isLoggingIn: false,
    hasAttemptedLogin: false,
    error: null,
    retryCount: 0,
  });

  // Reset login state when user logs out
  useEffect(() => {
    if (statusAuth === "logged-out") {
      setLoginState({
        isLoggingIn: false,
        hasAttemptedLogin: false,
        error: null,
        retryCount: 0,
      });
      loginAttemptRef.current = false;
    }
  }, [statusAuth]);

  const signInCrossmintToBackend = useCallback(async () => {
    // Prevent multiple simultaneous attempts
    if (loginAttemptRef.current) {
      console.log("Login attempt already in progress, skipping...");
      return;
    }

    if (!jwt) {
      const error = "Authentication token not available";
      setLoginState((prev) => ({ ...prev, error }));
      toast.error(error);
      return;
    }

    if (loginState.hasAttemptedLogin || loginState.retryCount >= maxRetries) {
      console.log("Login already attempted or max retries reached");
      return;
    }

    loginAttemptRef.current = true;
    setLoginState((prev) => ({
      ...prev,
      isLoggingIn: true,
      error: null,
    }));

    try {
      // Get wallet address from Crossmint wallet
      const walletAddress = wallet?.address || "";

      if (!walletAddress) {
        console.warn(
          "Wallet address not available, proceeding with Crossmint token only"
        );
      }
      // console.log('🔐 Signing in to backend with Crossmint token:');
      // console.log('User:', user);
      // console.log('Wallet Address:', walletAddress);
      // console.log('Wallet Address JWT:', jwt);

      // console.log('response', response);
      // console.log('response', response?.user);

      // if (response.user) {
      // const userData = response.user;

      // Sign in to NextAuth with proper error handling
      setPendingAuthIntent({ type: "login_completed", method: "crossmint" });
      const result = await signIn("crossmint", {
        jwt: jwt,
        userId: user?.id,
        email: user?.email,
        address: wallet?.address,
        // username: userData?.username,
        id_twitter: user?.twitter?.id,
        referral_id: referral_id,
        // _id: userData?._id,
        // userId: userData.id_crossmint,
        // email: userData.email,
        // address: userData.address,
        // username: userData?.username,
        // id_twitter: userData?.id_twitter,
        // _id: userData?._id,
        redirect: false, // Handle redirect manually
      }).catch((error) => {
        console.log("Error during signIn:", error);
      });
      // console.log("signIn result", result);

      if (result?.ok) {
        setLoginState((prev) => ({
          ...prev,
          isLoggingIn: false,
          error: null,
        }));
        window.sessionStorage.setItem("isAfterLogin", "false");
        track("wallet_connected", { wallet_type: "crossmint" });
      }
      if (result?.error) {
        throw new Error(`NextAuth error: ${result.error}`);
      }
      // }
      // else {
      //   throw new Error(response?.message || 'Backend authentication failed');
      // }
    } catch (error: unknown) {
      console.error("Crossmint login error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Login error occurred";

      setLoginState((prev) => ({
        ...prev,
        error: errorMessage,
        isLoggingIn: false,
        retryCount: prev.retryCount + 1,
        hasAttemptedLogin: prev.retryCount + 1 >= maxRetries,
      }));

      // Only show toast for first few errors to avoid spam
      if (loginState.retryCount < 2) {
        toast.error(errorMessage);
      }
      crossmintAuth.logout();
    } finally {
      loginAttemptRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    jwt,
    loginState.hasAttemptedLogin,
    loginState.retryCount,
    wallet?.address,
    user,
  ]);

  // Auto-login when Crossmint authentication is successful
  useEffect(() => {
    if (
      statusAuth === "logged-in" &&
      user &&
      jwt &&
      !loginState.hasAttemptedLogin &&
      !loginState.isLoggingIn &&
      !loginAttemptRef.current &&
      loginState.retryCount < maxRetries
    ) {
      // console.log('✅ Crossmint user authenticated, starting backend login:', {
      //   user: { id: user.id, email: user.email },
      //   wallet: { address: wallet?.address, status },
      // });

      // Add a small delay to prevent rapid fire requests
      const timeoutId = setTimeout(() => {
        if (window.sessionStorage.getItem("isAfterLogin") === "true") {
          signInCrossmintToBackend();
        }
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [
    statusAuth,
    user,
    jwt,
    wallet?.address,
    signInCrossmintToBackend,
    loginState.hasAttemptedLogin,
    loginState.isLoggingIn,
    loginState.retryCount,
    status,
  ]);

  const signOutAuth = useCallback(async () => {
    await Promise.all([
      crossmintAuth.logout(),
      signOut({ redirect: true, callbackUrl: "/" }),
    ]);
    setLoginState({
      isLoggingIn: false,
      hasAttemptedLogin: false,
      error: null,
      retryCount: 0,
    });
    loginAttemptRef.current = false;
  }, [crossmintAuth]);

  // Debug what we're returning
  // console.log('🔍 useCrossmintLogin returning:', {
  //   hasLogin: !!crossmintAuth.login,
  //   loginType: typeof crossmintAuth.login,
  //   statusAuth: crossmintAuth.status,
  //   hasUser: !!crossmintAuth.user,
  //   hasJwt: !!crossmintAuth.jwt,
  // });

  //@TODO Beware of Error store initialization when call in client pages
  const {
    data: getCheck,
    // error,
    // isLoading,
    // isError,
  } = useQuery<ResponseWithdrawCheck>({
    queryKey: ["getCheck"],
    queryFn: () => fetcherPost("/withdraw/check"),
    staleTime: Infinity,
    enabled: session?.user != null || !isMounted,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return {
    ...crossmintAuth,
    ...crossmintWallet,
    signOutAuth,
    loginState,
    getCheck,
    session,
  };
};

export default useCrossmintLogin;
