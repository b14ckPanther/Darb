"use client";

import { useActionState, useCallback } from "react";

import { initialFormState, type FormState } from "../../../../../lib/forms";

export type RestaurantFormAction = (
  previousState: FormState,
  formData: FormData,
) => Promise<FormState>;

export function useRestaurantActionState(action: RestaurantFormAction) {
  const resilientAction = useCallback(
    async (previousState: FormState, formData: FormData): Promise<FormState> => {
      try {
        return await action(previousState, formData);
      } catch {
        return {
          message: "The Restaurant request did not complete. Check your connection and try again.",
          status: "error",
        };
      }
    },
    [action],
  );

  return useActionState(resilientAction, initialFormState);
}
