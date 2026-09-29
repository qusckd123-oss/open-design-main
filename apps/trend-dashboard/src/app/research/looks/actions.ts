"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import {
  addLookToCluster, addReviewedLookTag, approveLookCluster, createLookAccount,
  createLookCluster, createLookObservation, lookMutationError, reviewLookObservation,
  updateLookAccount
} from "@/services/look-service";

export async function mutateLook(formData: FormData) {
  const session = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!verifySessionToken(session)) redirect("/login?from=/research/looks");
  const input: Record<string, string> = {};
  for (const [key, value] of formData.entries()) if (typeof value === "string") input[key] = value;
  let result = "저장했습니다.";
  try {
    switch (input.operation) {
      case "account-create": await createLookAccount(input); break;
      case "account-update": await updateLookAccount(input); break;
      case "observation-create": await createLookObservation(input); break;
      case "observation-review": await reviewLookObservation(input); break;
      case "cluster-create": await createLookCluster(input); break;
      case "cluster-link": await addLookToCluster(input); break;
      case "cluster-approve": await approveLookCluster(input); break;
      case "tag-add": await addReviewedLookTag(input); break;
      default: throw new Error("알 수 없는 작업입니다.");
    }
  } catch (error) {
    result = lookMutationError(error);
  }
  revalidatePath("/research/looks");
  revalidatePath("/");
  redirect(`/research/looks?notice=${encodeURIComponent(result)}`);
}
