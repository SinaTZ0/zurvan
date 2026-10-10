import type { Seats } from "~/routes/home/components/seat-roster";

/*===== Pets =====*/
// What the finder's first blank offers. Age matters as much as species: puppies and kittens get their own courses.
export type PetKind = "dog" | "puppy" | "cat" | "kitten";

/** The first blank of the sentence, written to follow "برای" ("برای سگم"). */
export const PET_KINDS: { value: PetKind; label: string }[] = [
  { value: "dog", label: "سگم" },
  { value: "puppy", label: "توله‌سگم" },
  { value: "cat", label: "گربه‌ام" },
  { value: "kitten", label: "بچه‌گربه‌ام" },
];

/*===== Problems =====*/
export type Problem = {
  id: string;
  species: "dog" | "cat";
  /** The pets the problem is offered for in the finder. */
  pets: PetKind[];
  /** Fills the sentence's second blank, after "که": "که قلاده می‌کشد". */
  phrase: string;
  /** Stands alone in the index, in the owner's own words. */
  title: string;
  course: { slug: string; title: string; trainer: string; photo: string; photoAlt: string };
  nextRun: { startsAt: Date; place: string; seats: Seats };
};

// Sample data: once courses exist, each course lists the problems it solves and this comes from the database.
export const PROBLEMS: Problem[] = [
  /*------ Dogs ------*/
  {
    id: "leash",
    species: "dog",
    pets: ["dog"],
    phrase: "قلاده می‌کشد",
    title: "قلاده را می‌کشد",
    course: {
      slug: "loose-leash-walking",
      title: "راه رفتن با قلاده، بدون کشیدن",
      trainer: "مهسا نوری",
      photo: "/demo/course-leash.jpg",
      photoAlt: "مربی‌ای که چند سگ را با قلاده در جاده‌ای خاکی می‌برد",
    },
    nextRun: {
      startsAt: new Date("2026-10-17T17:00:00+03:30"),
      place: "تهران، پارک آب و آتش",
      seats: { capacity: 10, reserved: 7, minToStart: 9 },
    },
  },
  {
    id: "recall",
    species: "dog",
    pets: ["dog", "puppy"],
    phrase: "صدایش می‌زنم و نمی‌آید",
    title: "صدایش می‌زنم و نمی‌آید",
    course: {
      slug: "reliable-recall",
      title: "آمدن با صدا زدن",
      trainer: "نگار رحیمی",
      photo: "/demo/course-recall.jpg",
      photoAlt: "یک سگ کورگی در چمنزار که به بالا نگاه می‌کند",
    },
    nextRun: {
      startsAt: new Date("2026-10-27T17:30:00+03:30"),
      place: "کرج، مهرشهر",
      seats: { capacity: 8, reserved: 2, minToStart: 5 },
    },
  },
  {
    id: "alone",
    species: "dog",
    pets: ["dog"],
    phrase: "تنها که می‌ماند پارس می‌کند",
    title: "تنها که می‌ماند، پارس می‌کند",
    course: {
      slug: "separation-anxiety",
      title: "آرامش در تنهایی",
      trainer: "سمانه کریمی",
      photo: "/demo/course-anxiety.jpg",
      photoAlt: "زنی کنار پنجره سگش را در آغوش گرفته است",
    },
    nextRun: {
      startsAt: new Date("2026-10-24T18:00:00+03:30"),
      place: "تهران، سعادت‌آباد",
      seats: { capacity: 8, reserved: 4, minToStart: 5 },
    },
  },
  {
    id: "listen",
    species: "dog",
    pets: ["dog", "puppy"],
    phrase: "حرف گوش نمی‌دهد",
    title: "حرف گوش نمی‌دهد",
    course: {
      slug: "basic-obedience",
      title: "اطاعت‌پذیری مقدماتی سگ",
      trainer: "نگار رحیمی",
      photo: "/demo/course-obedience.jpg",
      photoAlt: "مربی زانو زده و سگ کوچکی جلویش نشسته است",
    },
    nextRun: {
      startsAt: new Date("2026-10-18T10:00:00+03:30"),
      place: "تهران، شهرک اکباتان",
      seats: { capacity: 10, reserved: 6, minToStart: 8 },
    },
  },
  {
    id: "jumping",
    species: "dog",
    pets: ["dog"],
    phrase: "روی مهمان‌ها می‌پرد",
    title: "روی مهمان‌ها می‌پرد",
    course: {
      slug: "city-manners",
      title: "آداب شهری: کافه، مترو، خیابان",
      trainer: "مهسا نوری",
      photo: "/demo/course-city.jpg",
      photoAlt: "یک گلدن رتریور خوشحال در کافه",
    },
    nextRun: {
      startsAt: new Date("2026-10-22T17:00:00+03:30"),
      place: "تهران، ونک",
      seats: { capacity: 10, reserved: 6, minToStart: 6 },
    },
  },
  {
    id: "puppy-bite",
    species: "dog",
    pets: ["puppy"],
    phrase: "همه‌چیز را گاز می‌گیرد",
    title: "توله‌ام همه‌چیز را گاز می‌گیرد",
    course: {
      slug: "puppy-foundations",
      title: "آموزش توله‌سگ، ۲ تا ۶ ماهگی",
      trainer: "سمانه کریمی",
      photo: "/demo/course-puppy.jpg",
      photoAlt: "دو توله‌سگ گلدن رتریور روی چمن",
    },
    nextRun: {
      startsAt: new Date("2026-10-25T16:00:00+03:30"),
      place: "تهران، سعادت‌آباد",
      seats: { capacity: 8, reserved: 8, minToStart: 5 },
    },
  },

  /*------ Cats ------*/
  {
    id: "scratch",
    species: "cat",
    pets: ["cat", "kitten"],
    phrase: "مبل را چنگ می‌زند",
    title: "مبل را چنگ می‌زند",
    course: {
      slug: "calm-cat",
      title: "رفتار و آرامش گربه در خانه",
      trainer: "الهام شریفی",
      photo: "/demo/course-cat-behaviour.jpg",
      photoAlt: "گربه‌ای با چشم‌های سبز در نور کم",
    },
    nextRun: {
      startsAt: new Date("2026-10-20T19:00:00+03:30"),
      place: "آنلاین",
      seats: { capacity: 20, reserved: 9, minToStart: 6 },
    },
  },
  {
    id: "litter",
    species: "cat",
    pets: ["cat", "kitten"],
    phrase: "از ظرف خاک استفاده نمی‌کند",
    title: "از ظرف خاک استفاده نمی‌کند",
    course: {
      slug: "litter-and-habits",
      title: "ظرف خاک و عادت‌های خانه",
      trainer: "الهام شریفی",
      photo: "/demo/species-cat.jpg",
      photoAlt: "یک گربه‌ی نارنجی کنار پنجره",
    },
    nextRun: {
      startsAt: new Date("2026-10-26T19:00:00+03:30"),
      place: "آنلاین",
      seats: { capacity: 20, reserved: 3, minToStart: 6 },
    },
  },
  {
    id: "night",
    species: "cat",
    pets: ["cat"],
    phrase: "شب‌ها بی‌قرار است",
    title: "شب‌ها بی‌قرار است و سروصدا می‌کند",
    course: {
      slug: "calm-cat",
      title: "رفتار و آرامش گربه در خانه",
      trainer: "الهام شریفی",
      photo: "/demo/course-cat-behaviour.jpg",
      photoAlt: "گربه‌ای با چشم‌های سبز در نور کم",
    },
    nextRun: {
      startsAt: new Date("2026-10-20T19:00:00+03:30"),
      place: "آنلاین",
      seats: { capacity: 20, reserved: 9, minToStart: 6 },
    },
  },
  {
    id: "kitten-new",
    species: "cat",
    pets: ["kitten"],
    phrase: "تازه به خانه آمده",
    title: "بچه‌گربه‌ام تازه به خانه آمده",
    course: {
      slug: "kitten-at-home",
      title: "بچه‌گربه در خانه‌ی جدید",
      trainer: "الهام شریفی",
      photo: "/demo/course-kitten.jpg",
      photoAlt: "یک بچه‌گربه‌ی کنجکاو روی مبل",
    },
    nextRun: {
      startsAt: new Date("2026-10-21T19:00:00+03:30"),
      place: "آنلاین",
      seats: { capacity: 16, reserved: 5, minToStart: 6 },
    },
  },
];

/** The problems offered for a pet in the finder, in index order. */
export function problemsFor(pet: PetKind): Problem[] {
  return PROBLEMS.filter((problem) => problem.pets.includes(pet));
}
