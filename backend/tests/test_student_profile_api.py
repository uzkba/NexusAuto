URL = "/students/me/profile"


def payload(**over):
    data = {"city_ibge": 2510808, "vehicle_interest": "car", "objectives": ["first_license"]}
    data.update(over)
    return data


# ---------- autenticação e papel ----------

def test_requires_authentication(client):
    # o stub atual de get_current_user_optional devolve None -> 401
    assert client.get(URL).status_code == 401
    assert client.put(URL, json=payload()).status_code == 401


def test_instructor_is_forbidden(client, login_as, instrutor):
    login_as(instrutor)
    assert client.get(URL).status_code == 403
    assert client.put(URL, json=payload()).status_code == 403


# ---------- GET ----------

def test_get_returns_empty_profile_for_new_student(client, login_as, aluno):
    login_as(aluno)
    r = client.get(URL)
    assert r.status_code == 200
    assert r.json() == {"city": None, "vehicle_interest": None, "objectives": []}


# ---------- PUT: caminho feliz ----------

def test_put_creates_profile_and_get_returns_it(client, login_as, aluno, patos):
    login_as(aluno)
    r = client.put(URL, json=payload(objectives=["first_license", "highway_practice"]))
    assert r.status_code == 200
    body = r.json()
    assert body["city"] == {"ibge_code": 2510808, "name": "Patos", "uf": "PB"}
    assert body["vehicle_interest"] == "car"
    assert body["objectives"] == ["first_license", "highway_practice"]
    assert client.get(URL).json() == body


def test_put_is_idempotent(client, login_as, aluno, patos):
    login_as(aluno)
    first = client.put(URL, json=payload())
    second = client.put(URL, json=payload())
    assert first.status_code == second.status_code == 200
    assert first.json() == second.json()


def test_put_replaces_previous_values(client, login_as, aluno, patos):
    login_as(aluno)
    client.put(URL, json=payload())
    r = client.put(
        URL,
        json=payload(vehicle_interest="motorcycle", objectives=["resume_driving", "highway_practice"]),
    )
    assert r.status_code == 200
    assert r.json()["vehicle_interest"] == "motorcycle"
    assert r.json()["objectives"] == ["resume_driving", "highway_practice"]


def test_put_removes_duplicate_objectives(client, login_as, aluno, patos):
    login_as(aluno)
    r = client.put(URL, json=payload(objectives=["first_license", "first_license"]))
    assert r.status_code == 200
    assert r.json()["objectives"] == ["first_license"]


# ---------- PUT: validações (critérios de aceite) ----------

def test_put_with_empty_objectives_returns_422_with_clear_message(client, login_as, aluno, patos):
    login_as(aluno)
    r = client.put(URL, json=payload(objectives=[]))
    assert r.status_code == 422
    assert r.json()["errors"] == [
        {"field": "objectives", "message": "Selecione pelo menos um objetivo."}
    ]


def test_put_with_empty_objectives_does_not_persist(client, login_as, aluno, patos):
    login_as(aluno)
    client.put(URL, json=payload(objectives=[]))
    assert client.get(URL).json()["objectives"] == []


def test_put_without_vehicle_returns_422(client, login_as, aluno, patos):
    login_as(aluno)
    data = payload()
    del data["vehicle_interest"]
    r = client.put(URL, json=data)
    assert r.status_code == 422
    assert r.json()["errors"] == [
        {"field": "vehicle_interest", "message": "Campo obrigatório."}
    ]


def test_put_without_city_returns_422(client, login_as, aluno):
    login_as(aluno)
    data = payload()
    del data["city_ibge"]
    r = client.put(URL, json=data)
    assert r.status_code == 422
    assert r.json()["errors"] == [
        {"field": "city_ibge", "message": "Campo obrigatório."}
    ]


def test_put_with_unknown_city_returns_422(client, login_as, aluno):
    login_as(aluno)
    r = client.put(URL, json=payload(city_ibge=1))
    assert r.status_code == 422
    assert r.json()["errors"] == [
        {"field": "city_ibge", "message": "Cidade não encontrada."}
    ]


def test_put_with_invalid_vehicle_returns_422(client, login_as, aluno, patos):
    login_as(aluno)
    assert client.put(URL, json=payload(vehicle_interest="bike")).status_code == 422


def test_put_with_invalid_objective_returns_422(client, login_as, aluno, patos):
    login_as(aluno)
    assert client.put(URL, json=payload(objectives=["voar"])).status_code == 422