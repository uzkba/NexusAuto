import { useEffect } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ApiValidationError,
  getStudentProfile,
  saveStudentProfile,
} from "../api";
import {
  OBJECTIVES,
  VEHICLES,
  studentProfileSchema,
  type StudentProfileForm as FormValues,
} from "../schema";
import { CityCombobox } from "./CityCombobox";

const PROFILE_KEY = ["student-profile"];
const EMPTY: FormValues = { city: null, vehicle_interest: null, objectives: [] };

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-sm text-red-600">
      {message}
    </p>
  );
}

export function StudentProfileForm() {
  const queryClient = useQueryClient();

  const profile = useQuery({
    queryKey: PROFILE_KEY,
    queryFn: ({ signal }) => getStudentProfile(signal),
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    // cast deliberado: o zod infere city/vehicle_interest como não-nulos por causa do refine,
    // mas o formulário começa vazio (null). Em runtime o zod continua rejeitando null.
    resolver: zodResolver(studentProfileSchema) as unknown as Resolver<FormValues>,
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (profile.data) {
      reset({
        city: profile.data.city,
        vehicle_interest: profile.data.vehicle_interest,
        objectives: profile.data.objectives,
      });
    }
  }, [profile.data, reset]);

  const save = useMutation({
    mutationFn: saveStudentProfile,
    onSuccess: (saved) => {
      queryClient.setQueryData(PROFILE_KEY, saved);
      reset({
        city: saved.city,
        vehicle_interest: saved.vehicle_interest,
        objectives: saved.objectives,
      });
    },
    onError: (err) => {
      if (err instanceof ApiValidationError) {
        // erro do backend aparece no mesmo campo do formulário
        for (const [field, message] of Object.entries(err.fields)) {
          if (field in EMPTY) setError(field as keyof FormValues, { message });
        }
      }
    },
  });

  function onSubmit(values: FormValues) {
    // o zod já barrou os nulls; isto só estreita o tipo para o TypeScript
    if (!values.city || !values.vehicle_interest) return;
    save.mutate({
      city: values.city,
      vehicle_interest: values.vehicle_interest,
      objectives: values.objectives,
    });
  }

  if (profile.isPending) {
    return <div className="h-80 max-w-xl animate-pulse rounded-md bg-gray-100" />;
  }
  if (profile.isError) {
    return (
      <div
        role="alert"
        className="max-w-xl rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-700"
      >
        Não foi possível carregar seu perfil.{" "}
        <button type="button" onClick={() => profile.refetch()} className="underline">
          Tentar novamente
        </button>
      </div>
    );
  }

  const genericError =
    save.isError && !(save.error instanceof ApiValidationError)
      ? "Não foi possível salvar. Tente novamente."
      : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-xl space-y-8">
      <div>
        <label htmlFor="city" className="mb-1 block text-sm font-medium">
          Cidade/UF *
        </label>
        <Controller
          control={control}
          name="city"
          render={({ field }) => (
            <CityCombobox
              id="city"
              value={field.value}
              onChange={field.onChange}
              invalid={!!errors.city}
              describedBy="city-error"
            />
          )}
        />
        <p className="mt-1 text-xs text-gray-500">
          Será sua região padrão na busca de instrutores.
        </p>
        <FieldError id="city-error" message={errors.city?.message} />
      </div>

      <fieldset aria-describedby="vehicle-error">
        <legend className="mb-2 text-sm font-medium">
          Tipo de veículo de interesse *
        </legend>
        <div className="flex gap-6">
          {VEHICLES.map((v) => (
            <label key={v.value} className="flex items-center gap-2 text-sm">
              <input type="radio" value={v.value} {...register("vehicle_interest")} />
              {v.label}
            </label>
          ))}
        </div>
        <FieldError id="vehicle-error" message={errors.vehicle_interest?.message} />
      </fieldset>

      <fieldset aria-describedby="objectives-error">
        <legend className="text-sm font-medium">Objetivos *</legend>
        <p className="mb-2 text-xs text-gray-500">Selecione pelo menos um.</p>
        <Controller
          control={control}
          name="objectives"
          render={({ field }) => (
            <div className="space-y-2">
              {OBJECTIVES.map((o) => (
                <label key={o.value} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={field.value.includes(o.value)}
                    onChange={(e) =>
                      field.onChange(
                        e.target.checked
                          ? [...field.value, o.value]
                          : field.value.filter((v) => v !== o.value),
                      )
                    }
                  />
                  {o.label}
                </label>
              ))}
            </div>
          )}
        />
        {/* erro visual: aparece ao salvar sem objetivo (zod) ou se o backend devolver 422 */}
        <FieldError id="objectives-error" message={errors.objectives?.message} />
      </fieldset>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={save.isPending}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {save.isPending ? "Salvando..." : "Salvar"}
        </button>
        {save.isSuccess && !isDirty && (
          <span role="status" className="text-sm text-green-700">
            Perfil salvo.
          </span>
        )}
        {genericError && (
          <span role="alert" className="text-sm text-red-600">
            {genericError}
          </span>
        )}
      </div>
    </form>
  );
}