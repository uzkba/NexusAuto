import { useState } from "react";
import { ApiError } from "../../../lib/api";
import {
    useCreateAvaliacao,
    useMinhaAvaliacao,
    useUpdateAvaliacao,
} from "../api/reviews";
import type { ReviewPayload } from "../api/types";
import { formatDate } from "../format";
import { ReviewForm } from "./ReviewForm";
import { StarRatingDisplay } from "./StarRatingInput";

export interface ReviewSectionProps {
    instructorId: string;
    enabled?: boolean;
}

export function ReviewSection(props: ReviewSectionProps) {
    return <ReviewSectionContent key={props.instructorId} {...props} />;
}

function ReviewSectionContent({
    instructorId,
    enabled = true,
}: ReviewSectionProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);

    const statusQuery = useMinhaAvaliacao(instructorId, enabled);
    const createMutation = useCreateAvaliacao(instructorId);
    const updateMutation = useUpdateAvaliacao(instructorId);

    if (statusQuery.isPending) {
        return (
            <div
                aria-busy="true"
                aria-label="Carregando avaliação"
                className="animate-pulse space-y-3"
            >
                <div className="h-10 w-56 rounded-2xl bg-chip" />
                <div className="h-24 w-full rounded-2xl bg-chip" />
                <div className="h-11 w-40 rounded-2xl bg-chip" />
            </div>
        );
    }

    if (statusQuery.isError) {
        const err = statusQuery.error;
        if (err instanceof ApiError && err.status === 401) {
            return (
                <div className="rounded-2xl bg-chip p-5 text-[15px] font-medium text-ink">
                    Entre como aluno para avaliar este instrutor.
                </div>
            );
        }
        if (err instanceof ApiError && err.status === 403) {
            return (
                <div className="rounded-2xl bg-chip p-5 text-[15px] font-medium text-ink">
                    Apenas alunos podem avaliar instrutores.
                </div>
            );
        }
        return (
            <div role="alert" className="rounded-2xl bg-chip p-5">
                <p className="text-[15px] font-semibold text-ink">
                    Não foi possível carregar sua avaliação.
                </p>
                <p className="mt-1 text-sm text-soft">
                    Verifique sua conexão e tente novamente.
                </p>
                <button
                    type="button"
                    onClick={() => statusQuery.refetch()}
                    className="mt-4 cursor-pointer rounded-2xl bg-ink px-5 py-2.5 text-sm font-bold text-white transition hover:bg-dark"
                >
                    Tentar novamente
                </button>
            </div>
        );
    }

    const status = statusQuery.data;
    if (!status) {
        return null;
    }

    if (!status.can_review) {
        return (
            <div className="rounded-2xl border border-warn-border bg-warn-bg p-5 text-[15px] font-medium text-warn">
                Para avaliar este instrutor, primeiro entre em contato com ele
                pelo WhatsApp.
            </div>
        );
    }

    async function handleCreate(payload: ReviewPayload) {
        await createMutation.mutateAsync(payload);
        setFeedback("Avaliação enviada com sucesso!");
        setIsEditing(false);
    }

    async function handleUpdate(payload: ReviewPayload) {
        await updateMutation.mutateAsync(payload);
        setFeedback("Avaliação atualizada com sucesso!");
        setIsEditing(false);
    }

    const review = status.review;

    if (!review) {
        return (
            <ReviewForm
                mode="create"
                isSubmitting={createMutation.isPending}
                onSubmit={handleCreate}
            />
        );
    }

    if (isEditing) {
        return (
            <ReviewForm
                key={review.updated_at}
                mode="edit"
                initialValues={{
                    rating: review.rating,
                    comment: review.comment,
                }}
                isSubmitting={updateMutation.isPending}
                onSubmit={handleUpdate}
                onCancel={() => setIsEditing(false)}
            />
        );
    }

    const createdLabel = formatDate(review.created_at);
    const updatedLabel =
        review.updated_at && review.updated_at !== review.created_at
            ? formatDate(review.updated_at)
            : null;

    return (
        <div className="space-y-4">
            {feedback && (
                <div
                    role="status"
                    className="rounded-2xl border border-ok-border bg-ok-bg px-4 py-3 text-sm font-semibold text-ok"
                >
                    {feedback}
                </div>
            )}

            <div className="rounded-2xl bg-cream p-5 ring-1 ring-line">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <StarRatingDisplay rating={review.rating} />
                    <span className="text-xs font-medium text-muted">
                        Avaliado em {createdLabel}
                        {updatedLabel ? ` · Editado em ${updatedLabel}` : ""}
                    </span>
                </div>

                {review.comment ? (
                    <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-ink">
                        {review.comment}
                    </p>
                ) : (
                    <p className="mt-3 text-sm italic text-muted">
                        Sem comentário adicionado.
                    </p>
                )}

                <div className="mt-4">
                    <button
                        type="button"
                        onClick={() => {
                            setFeedback(null);
                            setIsEditing(true);
                        }}
                        className="cursor-pointer rounded-2xl bg-chip px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-sand"
                    >
                        Editar avaliação
                    </button>
                </div>
            </div>
        </div>
    );
}
