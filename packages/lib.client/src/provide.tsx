"use client";

import type { ReactNode, ComponentType } from "react";

type ProviderFactory = ComponentType<{ children: ReactNode }>;

/**
 * Composes multiple providers and wraps a component.
 * Providers are nested in order: first provider is outermost.
 *
 * @example
 * const LoginPage = Provide(
 *   [createAuthFeatures(authClient), createLoginFeatures()],
 *   function LoginPage() {
 *     const { signInMutation } = useLoginFeatures();
 *     // ...
 *   }
 * );
 */
export function Provide<P extends object>(
  providers: ProviderFactory[],
  Component: ComponentType<P>
): ComponentType<P> {
  const displayName = Component.displayName || Component.name || "Component";

  const WrappedComponent = (props: P) => {
    // Nest providers: [A, B, C] becomes <A><B><C>{children}</C></B></A>
    return providers.reduceRight(
      (children, Provider) => <Provider>{children}</Provider>,
      <Component {...props} />
    );
  };

  WrappedComponent.displayName = `Provide(${displayName})`;
  return WrappedComponent;
}
