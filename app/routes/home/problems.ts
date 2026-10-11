import { type Course, getCourse } from "~/routes/home/courses";

/*===== Problems =====*/
export type Problem = {
  id: string;
  /** Stands alone in the index, in the owner's own words. */
  title: string;
  course: Course;
  photo: string;
  photoAlt: string;
};

// Each problem points at the catalog course whose card covers it. Sample photos until the trainer's own arrive.
export const PROBLEMS: Problem[] = [
  {
    id: "leash",
    title: "قلاده را می‌کشد",
    course: getCourse("elementary"),
    photo: "/demo/course-leash.jpg",
    photoAlt: "چند سگ با قلاده در جاده‌ای خاکی",
  },
  {
    id: "recall",
    title: "صدایش می‌زنم و نمی‌آید",
    course: getCourse("advanced"),
    photo: "/demo/course-recall.jpg",
    photoAlt: "یک سگ کورگی در چمنزار که به بالا نگاه می‌کند",
  },
  {
    id: "guests",
    title: "روی مهمان‌ها می‌پرد",
    course: getCourse("house-manner"),
    photo: "/demo/course-city.jpg",
    photoAlt: "یک گلدن رتریور خوشحال در کافه",
  },
  {
    id: "noises",
    title: "از جاروبرقی و صدای بلند می‌ترسد",
    course: getCourse("cgc"),
    photo: "/demo/course-obedience.jpg",
    photoAlt: "مربی زانو زده و سگ کوچکی جلویش نشسته است",
  },
  {
    id: "strangers",
    title: "شش‌ماهه شده و با غریبه‌ها کنار نمی‌آید",
    course: getCourse("bmc"),
    photo: "/demo/course-agility.jpg",
    photoAlt: "سگ بوردر کالی روی نرده‌ی چوبی ایستاده است",
  },
  {
    id: "alone",
    title: "تنها که می‌ماند، پارس می‌کند",
    course: getCourse("behavior-modification"),
    photo: "/demo/course-anxiety.jpg",
    photoAlt: "زنی کنار پنجره سگش را در آغوش گرفته است",
  },
];
