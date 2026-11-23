from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


def validation_response(errors: list[dict[str, str]]) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={"detail": "Dados inválidos.", "errors": errors},
    )


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(RequestValidationError)
    async def _validation_handler(request: Request, exc: RequestValidationError):
        errors = []
        for err in exc.errors():
            field = ".".join(
                str(p) for p in err["loc"] if p not in ("body", "query", "path")
            )
            if err["type"] == "missing":
                message = "Campo obrigatório."
            elif err["type"] == "value_error":
                message = err["msg"].removeprefix("Value error, ")
            else:
                message = "Valor inválido."
            errors.append({"field": field, "message": message})
        return validation_response(errors)