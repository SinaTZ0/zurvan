import { cn } from "cn";

import { AUTH_PHOTO_STEP_NAMES, AUTH_SCENES, type AuthStepName } from "~/routes/auth/auth-scenes";

/*===== Auth Photos =====*/
/**
 * The dog's photo behind the form, one per step, crossfading when the step changes. Phones: a band on top that melts into
 * the black below. Desktop: it fills the page behind both columns, with the dark half deepening toward the form.
 *
 * All three photos are in the page from the start (the others hidden at opacity 0, low fetch priority), so a step change
 * is a plain opacity fade with nothing left to load. Opacity only; reduced motion swaps instantly. Steps that share a
 * photo (the phone and password steps) share its layer, so moving between them doesn't fade at all.
 */
export function AuthPhotos({ step }: { step: AuthStepName }) {
  return (
    <div className="relative h-[42svh] min-h-72 w-full lg:absolute lg:inset-0 lg:h-auto lg:min-h-0">
      {/*------ Photos ------*/}
      {AUTH_PHOTO_STEP_NAMES.map((name) => {
        const scene = AUTH_SCENES[name];
        const isActive = scene.photo === AUTH_SCENES[step].photo;
        return (
          <div
            key={name}
            aria-hidden={!isActive}
            className={cn(
              "absolute inset-0 motion-safe:transition-opacity motion-safe:duration-700 motion-safe:ease-in-out",
              isActive ? "opacity-100" : "opacity-0",
            )}
          >
            <picture>
              <source media="(min-width: 64rem)" srcSet={`/photo/${scene.photo}-1536.webp`} />
              <img
                src={`/photo/${scene.photo}-900.webp`}
                alt={scene.alt}
                width={1536}
                height={1024}
                fetchPriority={name === "phone" ? "high" : "low"}
                decoding={name === "phone" ? undefined : "async"}
                className={cn("size-full object-cover", scene.position)}
              />
            </picture>
          </div>
        );
      })}

      {/*------ Shade ------*/}
      {/* Phones: the photo melts into the black the form sits on. Desktop: the dark half deepens toward the form, and the
          bottom edge settles into black. Dark gradients only, from the text side, so the form reads over the photo. */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t from-jet to-transparent lg:hidden" />
      <div
        aria-hidden
        className="absolute inset-0 hidden bg-linear-to-l from-jet from-30% via-jet/60 via-50% to-transparent to-70% lg:block"
      />
      <div aria-hidden className="absolute inset-x-0 bottom-0 hidden h-32 bg-linear-to-t from-jet lg:block" />
    </div>
  );
}
