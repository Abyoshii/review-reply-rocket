
import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "@/lib/utils"
import { formatWbImageUrl } from "@/lib/imageUtils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, src, ...props }, ref) => {
  const [imgSrc, setImgSrc] = React.useState(src ? formatWbImageUrl(src) : undefined);
  const [imgError, setImgError] = React.useState(false);

  React.useEffect(() => {
    if (src) {
      const formattedUrl = formatWbImageUrl(src);
      setImgSrc(formattedUrl);
      setImgError(false);
    } else {
      setImgError(true);
    }
  }, [src]);

  return (
    <>
      {!imgError && (
        <AvatarPrimitive.Image
          ref={ref}
          className={cn("aspect-square h-full w-full object-cover", className)}
          src={imgSrc}
          onError={(e) => {
            console.error(`Не удалось загрузить изображение: ${imgSrc}`);
            setImgError(true);
          }}
          {...props}
        />
      )}
      {imgError && (
        <AvatarFallback>
          <span className="sr-only">Изображение недоступно</span>
          <span className="text-xs text-muted-foreground">Нет фото</span>
        </AvatarFallback>
      )}
    </>
  );
})
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
