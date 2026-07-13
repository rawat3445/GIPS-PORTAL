export const FACULTY_REVIEW_QUESTIONS = [
  {
    key: "teaching_clarity",
    label: "How clear and understandable is the teaching?",
  },
  {
    key: "doubt_solving",
    label: "How well are your doubts solved in class or after class?",
  },
  {
    key: "subject_knowledge",
    label: "How strong is the faculty member's subject knowledge?",
  },
  {
    key: "class_engagement",
    label: "How engaging and interactive are the classes?",
  },
  {
    key: "supportiveness",
    label: "How supportive and respectful is the faculty member with students?",
  },
  {
    key: "punctuality",
    label: "How punctual and prepared is the faculty member for class?",
  },
];

export const FACULTY_REVIEW_RATING_OPTIONS = [1, 2, 3, 4, 5];

export function createDefaultFacultyReviewRatings(defaultValue = null) {
  return FACULTY_REVIEW_QUESTIONS.reduce((accumulator, question) => {
    accumulator[question.key] = defaultValue;
    return accumulator;
  }, {});
}

export function normalizeFacultyReviewResponses(input) {
  const source = Array.isArray(input) ? input : [];

  return FACULTY_REVIEW_QUESTIONS.map((question) => {
    const matched = source.find((item) => item?.questionKey === question.key);
    const rating = Number(matched?.rating);

    return {
      questionKey: question.key,
      questionLabel: question.label,
      rating:
        Number.isFinite(rating) && rating >= 1 && rating <= 5
          ? Math.round(rating)
          : null,
    };
  });
}

export function getSubmittedFacultyReviewResponses(input) {
  return normalizeFacultyReviewResponses(input).filter((item) =>
    Number.isFinite(Number(item?.rating)),
  );
}

export function calculateFacultyReviewOverallRating(responses) {
  const ratings = (Array.isArray(responses) ? responses : [])
    .map((item) => Number(item?.rating))
    .filter((value) => Number.isFinite(value) && value >= 1 && value <= 5);

  if (!ratings.length) {
    return 0;
  }

  const total = ratings.reduce((sum, value) => sum + value, 0);
  return Number((total / ratings.length).toFixed(1));
}
