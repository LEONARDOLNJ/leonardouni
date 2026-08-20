import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface RouterContextType {
  path: string;
  navigate: (to: string) => void;
}

const RouterContext = createContext<RouterContextType>({
  path: "/",
  navigate: () => {},
});

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(() => {
    if (typeof window !== "undefined") {
      return window.location.pathname || "/";
    }
    return "/";
  });

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname || "/");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (to: string) => {
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", to);
      setPath(to);
      window.scrollTo(0, 0);
    }
  };

  return (
    <RouterContext.Provider value={{ path, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  return useContext(RouterContext);
}

export function Link({
  to,
  children,
  className,
  activeClassName,
  exact = false,
  onClick,
}: {
  to: string;
  children: ReactNode;
  className?: string;
  activeClassName?: string;
  exact?: boolean;
  key?: string | number;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  const { path, navigate } = useRouter();
  const isActive = exact ? path === to : path === to || (to !== "/" && path.startsWith(to));

  return (
    <a
      href={to}
      onClick={(e) => {
        e.preventDefault();
        if (onClick) {
          onClick(e);
        }
        navigate(to);
      }}
      className={`${className || ""} ${isActive && activeClassName ? activeClassName : ""}`}
    >
      {children}
    </a>
  );
}
