"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type CarouselEvent = "select" | "reInit";
type CarouselListener = (api: CarouselApi) => void;

type CarouselOptions = {
  axis?: "x" | "y";
  align?: "start" | "center" | "end";
  loop?: boolean;
  containScroll?: "trimSnaps" | "keepSnaps";
};

type CarouselPlugin = ReadonlyArray<unknown>;

type CarouselApi = {
  canScrollPrev: () => boolean;
  canScrollNext: () => boolean;
  scrollPrev: () => void;
  scrollNext: () => void;
  on: (event: CarouselEvent, callback: CarouselListener) => void;
  off: (event: CarouselEvent, callback: CarouselListener) => void;
};

type CarouselProps = {
  opts?: CarouselOptions;
  plugins?: CarouselPlugin;
  orientation?: "horizontal" | "vertical";
  setApi?: (api: CarouselApi) => void;
};

type CarouselContextProps = {
  carouselRef: React.RefCallback<HTMLDivElement>;
  api: CarouselApi;
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
} & CarouselProps;

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }

  return context;
}

function Carousel({
  orientation = "horizontal",
  opts,
  setApi,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & CarouselProps) {
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const listenersRef = React.useRef<
    Record<CarouselEvent, Set<CarouselListener>>
  >({
    select: new Set(),
    reInit: new Set(),
  });
  const canScrollPrevRef = React.useRef(false);
  const canScrollNextRef = React.useRef(false);
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);

  const axis = orientation === "vertical" || opts?.axis === "y" ? "y" : "x";

  const updateScrollState = React.useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      canScrollPrevRef.current = false;
      canScrollNextRef.current = false;
      setCanScrollPrev(false);
      setCanScrollNext(false);
      return;
    }

    if (axis === "y") {
      const maxTop = viewport.scrollHeight - viewport.clientHeight;
      const prev = viewport.scrollTop > 1;
      const next = viewport.scrollTop < maxTop - 1;
      canScrollPrevRef.current = prev;
      canScrollNextRef.current = next;
      setCanScrollPrev(prev);
      setCanScrollNext(next);
      return;
    }

    const maxLeft = viewport.scrollWidth - viewport.clientWidth;
    const prev = viewport.scrollLeft > 1;
    const next = viewport.scrollLeft < maxLeft - 1;
    canScrollPrevRef.current = prev;
    canScrollNextRef.current = next;
    setCanScrollPrev(prev);
    setCanScrollNext(next);
  }, [axis]);

  const emit = React.useCallback((event: CarouselEvent, api: CarouselApi) => {
    for (const listener of listenersRef.current[event]) {
      listener(api);
    }
  }, []);

  const scrollByPage = React.useCallback(
    (direction: "prev" | "next") => {
      const viewport = viewportRef.current;
      if (!viewport) {
        return;
      }

      const isPrev = direction === "prev";
      const delta =
        axis === "y" ? viewport.clientHeight || 0 : viewport.clientWidth || 0;
      const amount = isPrev ? -delta : delta;

      if (axis === "y") {
        const maxTop = Math.max(
          0,
          viewport.scrollHeight - viewport.clientHeight,
        );
        if (opts?.loop && !canScrollNextRef.current && !isPrev) {
          viewport.scrollTo({ top: 0, behavior: "smooth" });
        } else if (opts?.loop && !canScrollPrevRef.current && isPrev) {
          viewport.scrollTo({ top: maxTop, behavior: "smooth" });
        } else {
          viewport.scrollBy({ top: amount, behavior: "smooth" });
        }
      } else {
        const maxLeft = Math.max(
          0,
          viewport.scrollWidth - viewport.clientWidth,
        );
        if (opts?.loop && !canScrollNextRef.current && !isPrev) {
          viewport.scrollTo({ left: 0, behavior: "smooth" });
        } else if (opts?.loop && !canScrollPrevRef.current && isPrev) {
          viewport.scrollTo({ left: maxLeft, behavior: "smooth" });
        } else {
          viewport.scrollBy({ left: amount, behavior: "smooth" });
        }
      }
    },
    [axis, opts?.loop],
  );

  const scrollPrev = React.useCallback(() => {
    scrollByPage("prev");
  }, [scrollByPage]);

  const scrollNext = React.useCallback(() => {
    scrollByPage("next");
  }, [scrollByPage]);

  const api = React.useMemo<CarouselApi>(() => {
    return {
      canScrollPrev: () => canScrollPrevRef.current,
      canScrollNext: () => canScrollNextRef.current,
      scrollPrev,
      scrollNext,
      on: (event, callback) => {
        listenersRef.current[event].add(callback);
      },
      off: (event, callback) => {
        listenersRef.current[event].delete(callback);
      },
    };
  }, [scrollPrev, scrollNext]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (axis === "x" && event.key === "ArrowLeft") {
        event.preventDefault();
        scrollPrev();
      } else if (axis === "x" && event.key === "ArrowRight") {
        event.preventDefault();
        scrollNext();
      } else if (axis === "y" && event.key === "ArrowUp") {
        event.preventDefault();
        scrollPrev();
      } else if (axis === "y" && event.key === "ArrowDown") {
        event.preventDefault();
        scrollNext();
      }
    },
    [axis, scrollNext, scrollPrev],
  );

  const carouselRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      viewportRef.current = node;
      updateScrollState();
      emit("reInit", api);
    },
    [api, emit, updateScrollState],
  );

  React.useEffect(() => {
    if (!setApi) {
      return;
    }
    setApi(api);
  }, [api, setApi]);

  React.useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const handleSelect = () => {
      updateScrollState();
      emit("select", api);
    };

    const handleReInit = () => {
      updateScrollState();
      emit("reInit", api);
    };

    handleReInit();
    viewport.addEventListener("scroll", handleSelect, { passive: true });
    window.addEventListener("resize", handleReInit);

    return () => {
      viewport.removeEventListener("scroll", handleSelect);
      window.removeEventListener("resize", handleReInit);
    };
  }, [api, emit, updateScrollState]);

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api,
        opts,
        orientation: axis === "y" ? "vertical" : "horizontal",
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
      }}
    >
      <div
        onKeyDownCapture={handleKeyDown}
        className={cn("relative", className)}
        role="region"
        aria-roledescription="carousel"
        data-slot="carousel"
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  );
}

function CarouselContent({ className, ...props }: React.ComponentProps<"div">) {
  const { carouselRef, orientation } = useCarousel();

  return (
    <div
      ref={carouselRef}
      className={cn(
        "scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        orientation === "horizontal"
          ? "overflow-x-auto overflow-y-hidden"
          : "overflow-y-auto overflow-x-hidden",
      )}
      data-slot="carousel-content"
    >
      <div
        className={cn(
          "flex",
          orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function CarouselItem({ className, ...props }: React.ComponentProps<"div">) {
  const { orientation } = useCarousel();

  return (
    <div
      role="group"
      aria-roledescription="slide"
      data-slot="carousel-item"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className,
      )}
      {...props}
    />
  );
}

function CarouselPrevious({
  className,
  variant = "outline",
  size = "icon",
  ...props
}: React.ComponentProps<typeof Button>) {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel();

  return (
    <Button
      data-slot="carousel-previous"
      variant={variant}
      size={size}
      className={cn(
        "absolute size-8 rounded-full",
        orientation === "horizontal"
          ? "top-1/2 -left-12 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className,
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ArrowLeft />
      <span className="sr-only">Previous slide</span>
    </Button>
  );
}

function CarouselNext({
  className,
  variant = "outline",
  size = "icon",
  ...props
}: React.ComponentProps<typeof Button>) {
  const { orientation, scrollNext, canScrollNext } = useCarousel();

  return (
    <Button
      data-slot="carousel-next"
      variant={variant}
      size={size}
      className={cn(
        "absolute size-8 rounded-full",
        orientation === "horizontal"
          ? "top-1/2 -right-12 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className,
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ArrowRight />
      <span className="sr-only">Next slide</span>
    </Button>
  );
}

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
};
