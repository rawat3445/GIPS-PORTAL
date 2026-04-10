function safeString(value) {
  return String(value || "").trim();
}

function formatDateRange(startDate, endDate, duration) {
  const start = safeString(startDate);
  const end = safeString(endDate);
  const durationLabel = safeString(duration);

  if (durationLabel) return durationLabel;
  if (start && end) return `${start} - ${end}`;
  if (start) return start;
  if (end) return end;
  return "";
}

function getInitials(name) {
  return safeString(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function hasArrayContent(values) {
  return Array.isArray(values) && values.some((value) => safeString(value));
}

function getAccentClasses(accentColor) {
  if (accentColor === "blue") {
    return {
      band: "bg-blue-700",
      soft: "bg-blue-50 text-blue-700",
      border: "border-blue-200",
      text: "text-blue-700",
    };
  }

  if (accentColor === "emerald") {
    return {
      band: "bg-emerald-700",
      soft: "bg-emerald-50 text-emerald-700",
      border: "border-emerald-200",
      text: "text-emerald-700",
    };
  }

  if (accentColor === "amber") {
    return {
      band: "bg-amber-600",
      soft: "bg-amber-50 text-amber-700",
      border: "border-amber-200",
      text: "text-amber-700",
    };
  }

  return {
    band: "bg-slate-900",
    soft: "bg-slate-100 text-slate-700",
    border: "border-slate-200",
    text: "text-slate-700",
  };
}

function SectionHeading({ title, accentColor }) {
  const accent = getAccentClasses(accentColor);

  return (
    <div className="mb-3 flex items-center gap-3">
      <span className={`h-2.5 w-2.5 rounded-full ${accent.band}`} />
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
        {title}
      </h3>
      <span className={`h-px flex-1 ${accent.band} opacity-20`} />
    </div>
  );
}

function ContactLine({ personal }) {
  const parts = [
    safeString(personal.email),
    safeString(personal.phone),
    [safeString(personal.city), safeString(personal.state)].filter(Boolean).join(", "),
    safeString(personal.linkedin),
    safeString(personal.github),
    safeString(personal.portfolio),
    safeString(personal.enrollmentNo),
    [safeString(personal.course), personal.year ? `Year ${personal.year}` : ""]
      .filter(Boolean)
      .join(" | "),
  ].filter(Boolean);

  if (!parts.length) return null;

  return <p className="mt-3 text-sm leading-6 text-slate-600">{parts.join(" | ")}</p>;
}

function SummarySection({ summary, accentColor }) {
  if (!safeString(summary)) return null;

  return (
    <section>
      <SectionHeading title="Professional Summary" accentColor={accentColor} />
      <p className="text-sm leading-7 text-slate-700">{summary}</p>
    </section>
  );
}

function EducationSection({ education, accentColor }) {
  const items = Array.isArray(education) ? education : [];
  if (!items.length) return null;

  return (
    <section>
      <SectionHeading title="Education" accentColor={accentColor} />
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h4 className="text-base font-semibold text-slate-950">
                  {item.course || "Course"}
                </h4>
                <p className="mt-1 text-sm text-slate-700">
                  {[safeString(item.institution), safeString(item.location)]
                    .filter(Boolean)
                    .join(" | ")}
                </p>
              </div>
              <div className="text-sm text-slate-500 sm:text-right">
                <p>{[safeString(item.startYear), safeString(item.endYear)].filter(Boolean).join(" - ")}</p>
                {safeString(item.score) ? <p className="mt-1">Score: {item.score}</p> : null}
              </div>
            </div>
            {safeString(item.description) ? (
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function SkillsSection({ skills, accentColor }) {
  const groups = [
    { label: "Technical", values: skills?.technicalSkills || [] },
    { label: "Tools", values: skills?.tools || [] },
    { label: "Soft Skills", values: skills?.softSkills || [] },
    { label: "Languages", values: skills?.languages || [] },
  ].filter((group) => hasArrayContent(group.values));

  if (!groups.length) return null;

  return (
    <section>
      <SectionHeading title="Skills" accentColor={accentColor} />
      <div className="space-y-3">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="text-sm font-semibold text-slate-900">{group.label}</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {group.values.filter(Boolean).join(", ")}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProjectSection({ projects, accentColor }) {
  const items = Array.isArray(projects) ? projects : [];
  if (!items.length) return null;

  return (
    <section>
      <SectionHeading title="Projects" accentColor={accentColor} />
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h4 className="text-base font-semibold text-slate-950">
                  {item.title || "Project"}
                </h4>
                <p className="mt-1 text-sm text-slate-700">
                  {[safeString(item.role), hasArrayContent(item.techStack) ? item.techStack.join(", ") : ""]
                    .filter(Boolean)
                    .join(" | ")}
                </p>
              </div>
              <div className="text-sm text-slate-500 sm:text-right">
                <p>{formatDateRange(item.startDate, item.endDate)}</p>
                {safeString(item.link) ? <p className="mt-1 break-all">{item.link}</p> : null}
              </div>
            </div>
            {safeString(item.description) ? (
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
            ) : null}
            {hasArrayContent(item.bullets) ? (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600">
                {item.bullets.filter(Boolean).map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function InternshipSection({ internships, accentColor }) {
  const items = Array.isArray(internships) ? internships : [];
  if (!items.length) return null;

  return (
    <section>
      <SectionHeading title="Internships And Training" accentColor={accentColor} />
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h4 className="text-base font-semibold text-slate-950">
                  {item.role || "Internship"}
                </h4>
                <p className="mt-1 text-sm text-slate-700">{item.organization}</p>
              </div>
              <div className="text-sm text-slate-500 sm:text-right">
                <p>{formatDateRange(item.startDate, item.endDate, item.duration)}</p>
              </div>
            </div>
            {safeString(item.description) ? (
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
            ) : null}
            {hasArrayContent(item.bullets) ? (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600">
                {item.bullets.filter(Boolean).map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function CertificationsSection({ certifications, accentColor }) {
  const items = Array.isArray(certifications) ? certifications : [];
  if (!items.length) return null;

  return (
    <section>
      <SectionHeading title="Certifications" accentColor={accentColor} />
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h4 className="text-base font-semibold text-slate-950">
                  {item.title || "Certification"}
                </h4>
                <p className="mt-1 text-sm text-slate-700">
                  {[safeString(item.issuer), safeString(item.issuedOn)]
                    .filter(Boolean)
                    .join(" | ")}
                </p>
              </div>
              {safeString(item.link) ? (
                <p className="text-sm text-slate-500 sm:text-right">{item.link}</p>
              ) : null}
            </div>
            {safeString(item.description) ? (
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function AchievementsSection({ achievements, accentColor }) {
  const items = Array.isArray(achievements) ? achievements : [];
  if (!items.length) return null;

  return (
    <section>
      <SectionHeading title="Achievements" accentColor={accentColor} />
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h4 className="text-base font-semibold text-slate-950">
                  {item.title || "Achievement"}
                </h4>
                {safeString(item.source) ? (
                  <p className="mt-1 text-sm text-slate-500">{item.source}</p>
                ) : null}
              </div>
            </div>
            {safeString(item.description) ? (
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function ActivitiesSection({ activities, accentColor }) {
  const items = Array.isArray(activities) ? activities : [];
  if (!items.length) return null;

  return (
    <section>
      <SectionHeading title="Activities" accentColor={accentColor} />
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
            <h4 className="text-base font-semibold text-slate-950">
              {item.title || "Activity"}
            </h4>
            {safeString(item.description) ? (
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function EmptyPreviewState() {
  return (
    <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50/90 p-8 text-center text-sm text-slate-500">
      Start filling your details on the left to see your resume preview here.
    </div>
  );
}

function AtsTemplate({ resume }) {
  const accentColor = resume?.preferences?.accentColor || "slate";
  const showPhoto = Boolean(resume?.preferences?.showPhoto);
  const personal = resume?.personal || {};
  const sectionRenderers = {
    summary: () => SummarySection({ summary: resume?.summary, accentColor }),
    education: () =>
      EducationSection({ education: resume?.education, accentColor }),
    skills: () => SkillsSection({ skills: resume?.skills, accentColor }),
    projects: () =>
      ProjectSection({ projects: resume?.projects, accentColor }),
    internships: () =>
      InternshipSection({ internships: resume?.internships, accentColor }),
    certifications: () =>
      CertificationsSection({
        certifications: resume?.certifications,
        accentColor,
      }),
    achievements: () =>
      AchievementsSection({ achievements: resume?.achievements, accentColor }),
    activities: () =>
      ActivitiesSection({ activities: resume?.activities, accentColor }),
  };

  const visibleSections = (Array.isArray(resume?.preferences?.sectionOrder)
    ? resume.preferences.sectionOrder
    : []
  )
    .map((key) => ({
      key,
      node: typeof sectionRenderers[key] === "function" ? sectionRenderers[key]() : null,
    }))
    .filter((item) => item.node);

  if (
    !safeString(personal.fullName) &&
    !safeString(resume?.summary) &&
    visibleSections.length === 0
  ) {
    return <EmptyPreviewState />;
  }

  return (
    <article className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_32px_70px_-46px_rgba(15,23,42,0.45)]">
      <div className={`h-3 ${getAccentClasses(accentColor).band}`} />
      <div className="space-y-8 p-8">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-4xl font-bold tracking-tight text-slate-950">
              {personal.fullName || "Your Name"}
            </h1>
            {safeString(resume?.headline) ? (
              <p className="mt-3 text-lg font-medium text-slate-700">{resume.headline}</p>
            ) : null}
            <ContactLine personal={personal} />
          </div>
          {showPhoto ? (
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 text-2xl font-semibold text-slate-500">
              {safeString(personal.profileImage) ? (
                <img
                  src={personal.profileImage}
                  alt={personal.fullName || "Resume profile"}
                  className="h-full w-full object-cover"
                />
              ) : (
                getInitials(personal.fullName || "Student")
              )}
            </div>
          ) : null}
        </header>

        <div className="space-y-8">{visibleSections.map((section) => <div key={section.key}>{section.node}</div>)}</div>
      </div>
    </article>
  );
}

function ModernTemplate({ resume }) {
  const accentColor = resume?.preferences?.accentColor || "blue";
  const accent = getAccentClasses(accentColor);
  const showPhoto = Boolean(resume?.preferences?.showPhoto);
  const personal = resume?.personal || {};

  const primarySections = [
    SummarySection({ summary: resume?.summary, accentColor }),
    ProjectSection({ projects: resume?.projects, accentColor }),
    InternshipSection({ internships: resume?.internships, accentColor }),
    AchievementsSection({ achievements: resume?.achievements, accentColor }),
  ].filter(Boolean);

  const sidebarSections = [
    EducationSection({ education: resume?.education, accentColor }),
    SkillsSection({ skills: resume?.skills, accentColor }),
    CertificationsSection({
      certifications: resume?.certifications,
      accentColor,
    }),
    ActivitiesSection({ activities: resume?.activities, accentColor }),
  ].filter(Boolean);

  if (
    !safeString(personal.fullName) &&
    !safeString(resume?.summary) &&
    primarySections.length === 0 &&
    sidebarSections.length === 0
  ) {
    return <EmptyPreviewState />;
  }

  return (
    <article className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_32px_70px_-46px_rgba(15,23,42,0.45)]">
      <header className={`px-8 py-8 text-white ${accent.band}`}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/75">
              Resume Builder
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight">
              {personal.fullName || "Your Name"}
            </h1>
            {safeString(resume?.headline) ? (
              <p className="mt-2 text-lg text-white/90">{resume.headline}</p>
            ) : null}
            <p className="mt-3 text-sm leading-7 text-white/85">
              {[safeString(personal.email), safeString(personal.phone), safeString(personal.portfolio)]
                .filter(Boolean)
                .join(" | ")}
            </p>
            <p className="mt-2 text-sm leading-7 text-white/75">
              {[
                [safeString(personal.city), safeString(personal.state)].filter(Boolean).join(", "),
                safeString(personal.enrollmentNo),
                [safeString(personal.course), personal.year ? `Year ${personal.year}` : ""]
                  .filter(Boolean)
                  .join(" | "),
              ]
                .filter(Boolean)
                .join(" | ")}
            </p>
          </div>

          {showPhoto ? (
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-white/25 bg-white/10 text-2xl font-semibold text-white/90">
              {safeString(personal.profileImage) ? (
                <img
                  src={personal.profileImage}
                  alt={personal.fullName || "Resume profile"}
                  className="h-full w-full object-cover"
                />
              ) : (
                getInitials(personal.fullName || "Student")
              )}
            </div>
          ) : null}
        </div>
      </header>

      <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-8 p-8">
          {primarySections.length ? (
            primarySections.map((section, index) => <div key={`primary-${index}`}>{section}</div>)
          ) : (
            <EmptyPreviewState />
          )}
        </div>
        <aside className="space-y-8 border-t border-slate-200 bg-slate-50/80 p-8 lg:border-l lg:border-t-0">
          {sidebarSections.map((section, index) => (
            <div key={`sidebar-${index}`}>{section}</div>
          ))}
        </aside>
      </div>
    </article>
  );
}

export default function StudentResumePreview({ resume }) {
  const templateKey = safeString(resume?.templateKey) || "ats-clean";

  if (templateKey === "modern-student") {
    return <ModernTemplate resume={resume} />;
  }

  return <AtsTemplate resume={resume} />;
}
