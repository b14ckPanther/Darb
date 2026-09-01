"use client";

import { useEffect } from "react";

export function ItemDialogController() {
  useEffect(() => {
    let returnFocus: HTMLElement | null = null;

    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const opener = target.closest<HTMLElement>("[data-item-dialog-open]");
      if (opener) {
        const dialogId = opener.dataset.itemDialogOpen;
        const dialog = dialogId ? document.getElementById(dialogId) : null;
        if (dialog instanceof HTMLDialogElement) {
          returnFocus = opener;
          dialog.showModal();
        }
        return;
      }

      const closer = target.closest<HTMLElement>("[data-item-dialog-close]");
      if (closer) closer.closest("dialog")?.close();
      if (target instanceof HTMLDialogElement) {
        const bounds = target.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        ) {
          target.close();
        }
      }
    };
    const onClose = () => {
      returnFocus?.focus();
      returnFocus = null;
    };

    document.addEventListener("click", onClick);
    document.addEventListener("close", onClose, true);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("close", onClose, true);
    };
  }, []);

  return null;
}
