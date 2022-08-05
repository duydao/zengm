import { helpers } from "../../util";
import fuzzRating from "./fuzzRating";
import type { MinimalPlayerRatings } from "../../../common/types";

const sum = function (a: number, b: number) {
	return a + b;
};

const compositeRating = (
	ratings: MinimalPlayerRatings,
	components: (string | number)[],
	weights: number[] | undefined,
	fuzz: boolean,
): number => {
	if (weights === undefined) {
		// Default: array of ones with same size as components
		weights = Array(components.length).fill(1);
	}

	const numerators = [];
	const denominators = [];

	for (let i = 0; i < components.length; i++) {
		const component = components[i];
		const rating = getRating(ratings, component, fuzz);
		numerators.push(rating * weights[i]);
		denominators.push(100 * weights[i]);
	}

	const numerator = numerators.reduce(sum, 0);
	const denominator = denominators.reduce(sum, 0);

	return helpers.bound(numerator / denominator, 0, 1);
};

function getRating(
	ratings: MinimalPlayerRatings,
	component: string | number,
	fuzz: boolean,
): number {
	if (typeof component === "number") {
		return component;
	}

	// https://github.com/microsoft/TypeScript/issues/21732
	// @ts-expect-error
	const rating: number | undefined = ratings[component];
	if (rating === undefined) {
		throw new Error(`Undefined value for rating "${component}"`);
	}

	if (fuzz && component !== "hgt") {
		// Don't fuzz height
		return fuzzRating(rating, ratings.fuzz);
	}

	return rating;
}

export default compositeRating;
