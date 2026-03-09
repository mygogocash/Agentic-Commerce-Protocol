"use client";
import Input from "@/components/common/Input";
import SubPage from "../layout/SubPage";
import CardProfile from "./CardProfile";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { fetcher, fetcherPost, fetcherPut } from "@/lib/axios/client";
import { useQuery } from "@tanstack/react-query";
import { ResGetBalanceMyCashback } from "@/interfaces/userMyCashback";
import { checkThai, formatNumber } from "@/lib/utils";
import React from "react";
import Button from "@/components/common/Button";
import SaveIcon from "@/components/icons/SaveIcon";
import { Divider, MenuItem, Select } from "@mui/material";
import toast from "react-hot-toast";
import BoardProfile from "./BoardProfile";
import { ResponseWithdrawCheckMyCashback } from "@/interfaces/auth";
import { ResponseWithdrawCheck } from "@/interfaces/withdraw";

const gender = ["Male", "Female", "Other"];
const ProfileInfo = () => {
  const { data: session, update } = useSession();
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    username: "",
    birthdate: "",
    gender: "",
  });
  const { data: balanceMyCashback } = useQuery<ResGetBalanceMyCashback>({
    queryKey: ["balanceMyCashback"],
    queryFn: () => fetcher(`/user/balance/me/mycashback`),
    staleTime: Infinity,
  });

  const { data: myCashback } = useQuery<ResponseWithdrawCheckMyCashback>({
    queryKey: ["myCashback"],
    queryFn: () => fetcherPost(`/withdraw/check-my-cashback`),
    enabled: session?.user !== null,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const {
    data: getCheck,
    // error,
    // isLoading,
    // isError,
  } = useQuery<ResponseWithdrawCheck>({
    queryKey: ["getCheck"],
    queryFn: () => fetcherPost("/withdraw/check"),
    staleTime: Infinity,
    enabled: session?.user != null,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const saveProfile = async () => {
    setLoading(true);
    toast.loading("Saving...");
    try {
      if (
        (formData.username || session?.user.username) &&
        (formData.birthdate || session?.user.birthdate) &&
        (formData.gender || session?.user.gender)
      ) {
        const res = await fetcherPut([
          `/user/profile`,
          {
            data: {
              ...formData,
              username: formData.username || session?.user.username,
              birthdate: formData.birthdate || session?.user.birthdate,
              gender: formData.gender || session?.user.gender,
            },
          },
        ]);
        if (res) {
          update({
            ...session,
            user: { ...session?.user, ...res },
          });
          toast.success("Profile updated successfully");
        }
      } else {
        toast.error("Please fill all fields");
      }
      setLoading(false);
      toast.dismiss();
    } catch (e) {
      toast.error(`Error: Save profile failed ` + JSON.stringify(e));
      setLoading(false);
      toast.dismiss();
    }
  };
  return (
    <>
      <SubPage title="Profile" showSubMenu>
        {balanceMyCashback?.user?.mobile || session?.user?.mobile ? (
          <></>
        ) : (
          <div className="h-10 rounded-3xl flex items-center gap-3 p-2 bg-[#CD0D0D10] px-2 w-fit ml-auto">
            <p className="text-[16px] text-black">
              Verify Status :{" "}
              <span className="text-[#CD0D0D]">Don’t verify</span>{" "}
            </p>
            <button
              onClick={() => {
                router.push("/profile/verify-phone");
              }}
              className="bg-black rounded-3xl px-2 text-white h-6"
            >
              <span className=" text-[14px]">Verify now</span>
            </button>
          </div>
        )}

        <div className="hidden lg:block">
          <CardProfile />
        </div>
        <div className="lg:hidden block">
          <BoardProfile />
        </div>

        {myCashback && (
          <>
            <div className="w-full rounded-3xl pt-5 border border-[#E4E4E4] p-6 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[20px] text-black font-semibold">
                  {t("Total Cashback")}
                </h3>
                <Button
                  onClick={() => {
                    router.push(`/withdraw`);
                  }}
                >
                  {t("Withdraw")}
                </Button>
              </div>
              {/* {balanceMyCashback?.userMyCashback?.map((item) =>
                item?.balance.map((balance) => (
                  <div
                    key={balance._id}
                    className="w-full flex items-center justify-between"
                  >
                    <p className="text-[16px] text-black font-normal">
                      {": "}
                      <span className="font-semibold">
                        {formatNumber(balance.amount)}
                      </span>
                    </p>
                    <p className="text-[16px] text-black font-medium">
                      {balance.currency}
                    </p>
                  </div>
                ))
              )} */}

              {myCashback?.conversionIdMyCashback?.length > 0 && (
                <div className="w-full flex items-center justify-between">
                  <p className="text-[16px] text-black font-normal">
                    My Cashback:{" "}
                    <span className="font-semibold">
                      {formatNumber(
                        checkThai
                          ? myCashback?.availableTHB
                          : myCashback?.availableUSD,
                      )}
                    </span>
                  </p>
                  <p className="text-[16px] text-black font-medium">
                    {checkThai ? "THB" : "USD"}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <h1 className="text-[#000000] text-[16px] font-normal">
                  GOGOCASH:{" "}
                  <span className="font-semibold">
                    {formatNumber(
                      checkThai
                        ? getCheck?.netAmountTHB || 0
                        : getCheck?.netAmount || 0,
                    )}
                  </span>
                </h1>
                <p className="ml-auto">{checkThai ? "THB" : "USD"}</p>
              </div>
            </div>
          </>
        )}

        <div className="w-full rounded-3xl pt-5 border border-[#E4E4E4] p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[20px] text-black font-semibold">
              {t("Personal Information")}
            </h3>
            <Button
              bgColor="#8ADBAE"
              fontColor="#000"
              disabled={loading}
              loading={loading}
              onClick={() => {
                saveProfile();
              }}
            >
              <SaveIcon className="mr-2" /> Save
            </Button>
          </div>
          <Input
            className="w-full"
            sx={{
              " .MuiInputBase-root": { borderRadius: "16px" },
            }}
            placeholder="Username"
            defaultValue={
              (session?.user?.username &&
                session?.user?.username !== "undefined") ||
              ""
            }
            value={formData.username || session?.user?.username || ""}
            onChange={(e) => {
              setFormData({ ...formData, username: e.target.value });
            }}
          />
          <div
            className={`lg:flex items-end justify-between gap-3 space-y-3 lg:space-y-0`}
          >
            <div className="w-full">
              <Select
                value={formData.gender || session?.user?.gender || ""}
                onChange={(e) => {
                  setFormData({ ...formData, gender: e.target.value });
                }}
                sx={{ borderRadius: "16px", width: "100%" }}
              >
                {gender.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </Select>
            </div>
            <div className="w-full">
              <Input
                type="date"
                className="w-full  mt-0!"
                sx={{
                  " .MuiInputBase-root": { borderRadius: "16px" },
                }}
                onChange={(e) => {
                  setFormData({ ...formData, birthdate: e.target.value });
                }}
                placeholder="Birthdate"
                value={formData.birthdate || session?.user?.birthdate}
                defaultValue={session?.user?.birthdate || ""}
              />
            </div>
          </div>
          <Divider sx={{ mt: 2 }} />
          <div
            className={`lg:flex items-end justify-between gap-3 space-y-3 lg:space-y-0`}
          >
            <div className="w-full">
              <p className=" cursor-pointer text-white text-[14px]  text-right">
                Update Email
              </p>
              <Input
                className="w-full"
                sx={{
                  " .MuiInputBase-root": { borderRadius: "16px" },
                }}
                placeholder="Email"
                defaultValue={
                  (session?.user?.email && session?.user?.email !== "undefined"
                    ? session?.user?.email
                    : "") || ""
                }
                disabled
              />
            </div>
            <div className="w-full">
              <p
                onClick={() => {
                  router.push("/profile/verify-phone");
                }}
                className=" cursor-pointer text-[14px] text-[#5D87FF] text-right "
              >
                {session?.user?.mobile ? "Change" : "Update"} Phone Number
              </p>
              <Input
                className="w-full  mt-0!"
                sx={{
                  " .MuiInputBase-root": { borderRadius: "16px" },
                }}
                placeholder="Mobile Number"
                defaultValue={
                  session?.user?.mobile || balanceMyCashback?.user?.mobile || ""
                }
                disabled
              />
            </div>
          </div>
          <Input
            className="w-full"
            sx={{
              " .MuiInputBase-root": { borderRadius: "16px" },
            }}
            placeholder="Wallet"
            defaultValue={
              session?.user?.wallet && session?.user?.wallet !== "undefined"
                ? session?.user?.wallet
                : ""
            }
            disabled
          />
        </div>
      </SubPage>
    </>
  );
};

export default ProfileInfo;
