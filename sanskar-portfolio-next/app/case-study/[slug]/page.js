import Link from "next/link";
import { notFound } from "next/navigation";
import { CASE_STUDIES } from "../case-studies-data";
import CaseStudyFrame from "./CaseStudyFrame";
import styles from "./case-study.module.css";

export function generateStaticParams() {
  return Object.keys(CASE_STUDIES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const cs = CASE_STUDIES[slug];
  return { title: cs ? `${cs.title} · Sanskar Sharma` : "Case study" };
}

export default async function CaseStudyPage({ params }) {
  const { slug } = await params;
  const cs = CASE_STUDIES[slug];
  if (!cs) notFound();

  return (
    <div className={styles.wrap} style={{ "--accent": cs.accent }}>
      <header className={styles.bar}>
        <Link href="/" className={styles.back}>
          ← Back to the circus
        </Link>
        <div className={styles.titleWrap}>
          <span className={styles.eyebrow}>{cs.eyebrow}</span>
          <h1 className={styles.title}>{cs.title}</h1>
        </div>
        <span className={styles.star}>★</span>
      </header>
      <CaseStudyFrame src={cs.file} title={cs.title} slug={slug} />
    </div>
  );
}
