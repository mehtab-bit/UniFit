/**
 * Minimum MoveNet keypoint score a joint needs before it is shown or used in
 * angle math. Scores hover near 0.5-0.7 even for well-tracked joints on a
 * phone; anything lower flickers in and out and drags the angle with it.
 */
export const KEYPOINT_MIN_SCORE = 0.45;
