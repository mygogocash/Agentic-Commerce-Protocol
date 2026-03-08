"use client";

import useFirebaseLogin from "@/hooks/useFirebaseLogin";
import { OptionsCountries, ResponseCountry } from "@/interfaces/country";
import { Autocomplete, Dialog, TextField } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useMemo } from "react";
import ButtonLogin from "../common/ButtonLogin";
import { Link, usePathname } from "@/i18n/navigation";
import TelegramLogin from "../common/TelegramLogin";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import client from "@/lib/axios/client";
import { setPendingAuthIntent } from "@/lib/analytics";
import { signIn } from "next-auth/react";
import { IResponseLogin } from "@/interfaces/auth";
import { useSearchParams } from "next/navigation";
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onTelegramAuth: (user: any) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Telegram: any;
  }
}
const LoginComponent = () => {
  const {
    handleLoginGoogle,
    handleLoginX,
    setSelectCountry,
    selectCountry,
    handleLoginFacebook,
  } = useFirebaseLogin();
  const t = useTranslations();
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [showUpdateEmail, setShowUpdateEmail] = useState(false);

  const params = useSearchParams();
  const referral_id = params.get("referral_id");
  const { data: countries } = useQuery<ResponseCountry[]>({
    queryKey: ["/api/countries"],
    queryFn: () => axios.get("/api/countries").then((res) => res.data),
    staleTime: Infinity,
  });

  const listCountries = useMemo<OptionsCountries[]>(() => {
    return countries && countries?.length > 0
      ? countries?.map((country: ResponseCountry) => ({
          label: country.name.common,
          code: country.cca2,
          value: country.name.common,
        }))
      : [];
  }, [countries]);

  function loginWithTelegram() {
    const botId = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
    const endpoint = process.env.NEXT_PUBLIC_FRONTEND_URL;
    // const redirectUrl = encodeURIComponent(`${endpoint}/api/telegram`);
    const redirectUrl = `${endpoint}/login`;

    setPendingAuthIntent({
      type: pathname?.includes("register") ? "sign_up_completed" : "login_completed",
      method: "telegram",
    });

    window.location.assign(
      `https://oauth.telegram.org/auth?bot_id=${botId}` +
      `&origin=${endpoint}` +
      `&return_to=${redirectUrl}` +
      `&request_access=write`,
    );
  }

  const checkHasAcc = (telegramId: string) => {
    client
      .get(`/auth/check-account-telegram/${telegramId}`)
      .then((response) => {
        const data = response.data;
        console.log(">>>", response);
        if (!data) {
          setShowUpdateEmail(true);
        }
      });
  };

  useEffect(() => {
    if (params.get("id")) {
      checkHasAcc(params.get("id") || "");
    }
  }, [params]);

  useEffect(() => {
    const hash = window.location.hash;

    if (!hash.startsWith("#tgAuthResult=")) return;

    const encoded = hash.replace("#tgAuthResult=", "");
    const telegramData = JSON.parse(atob(encoded));

    console.log("Telegram Data:", telegramData);
    checkHasAcc(telegramData.id);
  }, []);

  const handleLoginTelegram = async () => {
    const id = params.get("id");
    const firstName = params.get("first_name");
    const username = params.get("username");
    const photoUrl = params.get("photo_url");
    const authDate = params.get("auth_date");
    const hash = params.get("hash");
    const dataTelegram = { id, firstName, username, photoUrl, authDate, hash };
    console.log("Logging in with Telegram data:", dataTelegram);

    console.log("email", email);
    console.log("referral_id", referral_id);
    // // ส่งไป API
    // Implement login logic here using dataTelegram
    const res = await client
      .post<IResponseLogin>(`/auth/log-in/telegram`, {
        ...dataTelegram,
        email,
        referral_id,
        country: selectCountry?.label || "Thailand",
      })
      .then((response) => response.data);
    console.log("res", res);

    if (res) {
      signIn("firebase", {
        jwt: res.token,
        email: res.user.email,
        provider: "telegram",
        referral_id,
        country: selectCountry?.label || "Thailand",
        pathname,
        type: "telegram",
        callbackUrl: "/",
        redirect: true,
      });
    }
  };

  // const isTelegramBrowser = () => {
  //   return window?.Telegram;
  // };

  return (
    <div className="container md:px-0 px-4 mt-6 mb-10 mx-auto">
      <Dialog
        open={params.get("id") !== null}
        // onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        sx={{ " .MuiPaper-root": { borderRadius: "16px" } }}
      >
        <div className="p-5 flex flex-col gap-5 w-[320px]">
          <p className="text-black">
            {showUpdateEmail
              ? `Update Email for Telegram Account`
              : `Login Telegram ${params.get("username") || ""}`}
          </p>

          {showUpdateEmail && (
            <Input
              placeholder="Email"
              onChange={(event) => {
                setEmail(event.target.value);
              }}
            />
          )}

          <div className="flex items-center gap-2">
            {/* {showUpdateEmail && (
              <Button
                onClick={() => {
                  handleLoginTelegram();
                }}
                fullWidth
                bgColor="white"
                fontColor="black"
              >
                Cancel
              </Button>
            )} */}
            <Button
              fullWidth
              onClick={() => {
                handleLoginTelegram();
              }}
            >
              Login
            </Button>
          </div>
        </div>
      </Dialog>
      <div className="grid md:grid-cols-2 gap-5 md:gap-10">
        <Image
          src={`/banner_login.png`}
          alt="Login Banner"
          width={588}
          height={690}
          className="max-w-[588px] max-h-[690px] w-full h-full rounded-2xl"
        />
        <div className="flex flex-col items-center gap-2">
          <Image
            src={`/logo_green.png`}
            alt="Login logo"
            width={60}
            height={60}
            className="max-w-[60px] max-h-[60px] w-full h-full rounded-2xl mb-5"
          />
          <div className="flex items-center justify-center flex-col">
            <h1 className="text-[#00B14F] text-[24px] md:text-[30px] font-semibold">
              {pathname === "/login" ? "Login" : "Register"} to Your Account
            </h1>
            <p className="text-[#6B7280] text-center text-[14px] md:text-[16px] mt-2 mb-6">
              Access your personalized dashboard and manage your preferences by
              logging into your account.
            </p>
          </div>

          <div className="flex items-center justify-between w-full mb-5">
            <p className="text-[18px] font-semibold text-[#000000] my-2">
              {t("Country/Region")}
            </p>
            <Autocomplete
              disablePortal
              options={listCountries || []}
              sx={{
                " .MuiInputBase-root": {
                  borderRadius: "16px",
                  minWidth: "200px",
                },
              }}
              value={
                selectCountry ||
                listCountries?.find((country) => country.code === "TH")
              }
              onChange={(event, newValue) => {
                setSelectCountry(newValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  sx={{ borderRadius: "16px" }}
                />
              )}
            />
          </div>
          <ButtonLogin
            handleLogin={handleLoginGoogle}
            icon="/social/google.png"
            text={`${pathname === "/login" ? "Login" : "Register"} with Google`}
          />
          <ButtonLogin
            handleLogin={handleLoginX}
            icon="/social/twitter.png"
            text={`${pathname === "/login" ? "Login" : "Register"} with X`}
          />

          <ButtonLogin
            handleLogin={() => {
              loginWithTelegram();
            }}
            icon="/social/telegram.png"
            text={`${
              pathname === "/login" ? "Login" : "Register"
            } with Telegram`}
          />
          <div className="hidden">
            <TelegramLogin />
          </div>
          <div className="hidden">
            <ButtonLogin
              handleLogin={handleLoginFacebook}
              icon="/social/facebook.png"
              text={`${
                pathname === "/login" ? "Login" : "Register"
              } with Facebook`}
            />
          </div>
          <p className="text-[#A9A9A9] mt-5 text-[16px]">
            Don’t have an Account ?{" "}
            {pathname === "/login" ? (
              <Link
                href="/register"
                className="text-[#00B14F] underline font-semibold"
              >
                Register here{" "}
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-[#00B14F] underline font-semibold"
              >
                Login here
              </Link>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
export default LoginComponent;
