import { useState } from "react";
import { Controller, useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ApiError } from "../../../lib/api";
import { ApiValidationError } from "../reviews";
import type { ReviewPayload } from "../types";
import { StarRatingInput } from "./StarRatingInput";

const MAX_COMMENT_LENGTH = 1000;
const RATING_ERROR = "Selecione uma nota de 1 a 5 estrelas.";

interface ReviewFormValues {
    rating: number | null;
    comment: string;
}

const reviewFormSchema = z.object({
    rating: z
        .number({ message: RATING_ERROR })
        .int(RATING_ERROR)
        .min(1, RATING_ERROR)
        .max(5, RATING_ERROR)
        .nullable()
        .refine(
            (value): value is number =>
                value !== null &&
                Number.isInteger(value) &&
                value >= 1 &&
                value <= 5,
            RATING_ERROR,
        ),
    comment: z
        .string()
        .max(
            MAX_COMMENT_LENGTH,
            `O comentário deve ter no máximo ${MAX_COMMENT_LENGTH} caracteres.`,
        ),
});

export interface ReviewFormProps {
    mode: "create" | "edit";
    initialValues?: { rating: number; comment: string | null };
    isSubmitting?: boolean;
    onSubmit: (payload: ReviewPayload) => Promise<void>;
    onCancel?: () => void;
}

export function ReviewForm({
    mode,
    initialValues,
    isSubmitting = false,
    onSubmit,
    onCancel,
}: ReviewFormProps) {
    const [formError, setFormError] = useState<string | null>(null);

    const {
        control,
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting: formIsSubmitting },
    } = useForm<ReviewFormValues>({
        resolver: zodResolver(
            reviewFormSchema,
        ) as unknown as Resolver<ReviewFormValues>,
        defaultValues: {
            rating: initialValues?.rating ?? null,
            comment: initialValues?.comment ?? "",
        },
    });

    const commentValue = useWatch({ control, name: "comment" }) ?? "";
    const commentLength = commentValue.length;
    const isOverLimit = commentLength > MAX_COMMENT_LENGTH;
    const busy = isSubmitting || formIsSubmitting;

    async function handleValidSubmit(values: ReviewFormValues) {
        if (values.rating === null) return;
        setFormError(null);

        const trimmed = values.comment.trim();
        const payload: ReviewPayload = {
            rating: values.rating,
            comment: trimmed.length > 0 ? trimmed : null,
        };

        try {
            await onSubmit(payload);
        } catch (err) {
            if (err instanceof ApiValidationError) {
                let mappedAny = false;
                for (const [field, message] of Object.entries(err.fields)) {
                    if (field === "rating" || field === "comment") {
                        setError(field, { message });
                        mappedAny = true;
                    }
                }
                if (!mappedAny) {
                    setFormError(err.message);
                }
                return;
            }
            if (err instanceof ApiError) {
                setFormError(err.message);
                return;
            }
            setFormError(
                mode === "edit"
                    ? "Não foi possível salvar suas alterações. Tente novamente."
                    : "Não foi possível enviar sua avaliação. Tente novamente.",
            );
        }
    }

    const submitLabel =
        mode === "edit"
            ? busy
                ? "Salvando..."
                : "Salvar alterações"
            : busy
              ? "Enviando..."
              : "Enviar avaliação";

    return (
        <form
            onSubmit={handleSubmit(handleValidSubmit)}
            noValidate
            className="space-y-5"
        >
            <div>
                <p
                    id="review-rating-label"
                    className="mb-2 text-sm font-semibold text-ink"
                >
                    Sua nota <span className="text-muted">*</span>
                </p>
                <Controller
                    control={control}
                    name="rating"
                    render={({ field }) => (
                        <StarRatingInput
                            value={field.value}
                            onChange={(next) => {
                                setFormError(null);
                                field.onChange(next);
                            }}
                            disabled={busy}
                            invalid={Boolean(errors.rating)}
                            labelledBy="review-rating-label"
                            describedBy={
                                errors.rating
                                    ? "review-rating-error"
                                    : undefined
                            }
                        />
                    )}
                />
                {errors.rating?.message && (
                    <p
                        id="review-rating-error"
                        role="alert"
                        className="mt-2 text-sm font-medium text-red-700"
                    >
                        {errors.rating.message}
                    </p>
                )}
            </div>

            <div>
                <div className="mb-2 flex items-baseline justify-between gap-2">
                    <label
                        htmlFor="review-comment"
                        className="text-sm font-semibold text-ink"
                    >
                        Comentário{" "}
                        <span className="font-normal text-muted">
                            (opcional)
                        </span>
                    </label>
                    <span
                        className={`text-xs font-medium tabular-nums ${
                            isOverLimit ? "text-red-700" : "text-muted"
                        }`}
                    >
                        {commentLength}/{MAX_COMMENT_LENGTH}
                    </span>
                </div>
                <textarea
                    id="review-comment"
                    rows={4}
                    disabled={busy}
                    placeholder="Conte como foi sua experiência com o instrutor..."
                    aria-invalid={Boolean(errors.comment) || undefined}
                    aria-describedby={
                        errors.comment ? "review-comment-error" : undefined
                    }
                    className={`w-full resize-y rounded-2xl border bg-cream px-4 py-3 text-[15px] text-ink placeholder:text-muted focus:bg-white focus:outline-2 focus:outline-offset-2 focus:outline-ink disabled:cursor-not-allowed disabled:opacity-60 ${
                        errors.comment ? "border-red-400" : "border-line"
                    }`}
                    {...register("comment", {
                        onChange: () => setFormError(null),
                    })}
                />
                {errors.comment?.message && (
                    <p
                        id="review-comment-error"
                        role="alert"
                        className="mt-1.5 text-sm font-medium text-red-700"
                    >
                        {errors.comment.message}
                    </p>
                )}
            </div>

            {formError && (
                <div
                    role="alert"
                    className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
                >
                    {formError}
                </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
                <button
                    type="submit"
                    disabled={busy}
                    className="cursor-pointer rounded-2xl bg-ink px-6 py-3 text-sm font-bold text-white transition hover:bg-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {submitLabel}
                </button>
                {mode === "edit" && onCancel && (
                    <button
                        type="button"
                        disabled={busy}
                        onClick={onCancel}
                        className="cursor-pointer rounded-2xl bg-chip px-5 py-3 text-sm font-semibold text-ink transition hover:bg-sand disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Cancelar
                    </button>
                )}
            </div>
        </form>
    );
}
