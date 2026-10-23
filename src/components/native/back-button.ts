/** Botón atrás de Android (TKT-047, spec `app-movil`): atrás si hay historial; si no, salir. */
export function handleBackButton(
  { canGoBack }: { canGoBack: boolean },
  actions: { goBack: () => void; exitApp: () => void },
): void {
  if (canGoBack) {
    actions.goBack();
  } else {
    actions.exitApp();
  }
}
