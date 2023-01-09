# Login master user
POST {{base_url}}/api/login
{
    "email": "projekt@dietenbach.de",
    "password": "projekt"
}
HTTP/1.1 200

[Captures]
auth-cookie: cookie "vmp_auth"

# Create concept assignment
POST http://localhost:8080/api/admin/concept-assignment
Cookie: vmp_auth: {{auth-cookie}}
{
    "name": "Test Concept Assignment",
    "shape": {
        "geoJson":{
            "id":"87f310e9-cf8f-44cb-af2b-2d9395b25d82",
            "type":"Feature",
            "geometry":{
                "type":"Polygon",
                "coordinates":[
                    [
                        [
                            7.837448858316606,
                            47.99339053328853
                        ],
                        [
                            7.837121200350714,
                            47.99348893325191
                        ],
                        [
                            7.836830531962245,
                            47.993589228413384
                        ],
                        [
                            7.836462347976491,
                            47.993717121547235
                        ],
                        [
                            7.836024508877217,
                            47.99386494655539
                        ],
                        [
                            7.83612526382712,
                            47.99400278508966
                        ],
                        [
                            7.836394105825918,
                            47.99436175092589
                        ],
                        [
                            7.836625663507266,
                            47.994666096579806
                        ],
                        [
                            7.836939756251372,
                            47.995061599237374
                        ],
                        [
                            7.837220022019402,
                            47.99542585041186
                        ],
                        [
                            7.837698196342489,
                            47.99605547219335
                        ],
                        [
                            7.838369183654646,
                            47.99583390557464
                        ],
                        [
                            7.838375935928127,
                            47.995845536285174
                        ],
                        [
                            7.838548695869529,
                            47.996052214512105
                        ],
                        [
                            7.838630531351328,
                            47.99615011756012
                        ],
                        [
                            7.838843733249798,
                            47.996415543385126
                        ],
                        [
                            7.839071448142289,
                            47.996724994999425
                        ],
                        [
                            7.839363206099032,
                            47.9970970545705
                        ],
                        [
                            7.838692543601455,
                            47.997335445358516
                        ],
                        [
                            7.838890374884033,
                            47.99760332224153
                        ],
                        [
                            7.839256468885107,
                            47.99808455978621
                        ],
                        [
                            7.839772109860841,
                            47.99875831514089
                        ],
                        [
                            7.839949163752263,
                            47.99899407874278
                        ],
                        [
                            7.84043609974683,
                            47.998823435085086
                        ],
                        [
                            7.841137326237334,
                            47.998583544988236
                        ],
                        [
                            7.841827566202639,
                            47.9983695296045
                        ],
                        [
                            7.841398859394972,
                            47.99781374042806
                        ],
                        [
                            7.840663101148059,
                            47.99685530775517
                        ],
                        [
                            7.83993960154446,
                            47.99604394885404
                        ],
                        [
                            7.839935546456139,
                            47.99603940048587
                        ],
                        [
                            7.8393413628338395,
                            47.995293984753175
                        ],
                        [
                            7.839113925741652,
                            47.99504711419178
                        ],
                        [
                            7.838915362002031,
                            47.994844631864254
                        ],
                        [
                            7.838652825889783,
                            47.994565322935614
                        ],
                        [
                            7.8383835313826635,
                            47.994322037908915
                        ],
                        [
                            7.838255046382354,
                            47.99419244931477
                        ],
                        [
                            7.837851239176694,
                            47.99382355360865
                        ],
                        [
                            7.837822502443301,
                            47.9937926298924
                        ]
                    ]
                ]
            },
            "properties":{
                "nr":"5133",
                "gid":"110",
                "umfang":"1671.0901202128175",
                "flaeche":"84163.66857666525"
            }
        }
    },
    "buildingType": "GGW"
}

HTTP/1.1 200

# Get all concepts assignment id
GET http://localhost:8080/api/admin/concept-assignments?state=DRAFT
Cookie: vmp_auth: {{auth-cookie}}

HTTP/1.1 200
[Captures]
concept-assignment-id: jsonpath "$.[0].assignment.id"

# Post questions
POST http://localhost:8080/api/admin/concept-assignment/{{concept-assignment-id}}/questions
{
    "questions":[
        {
            "id":"fc420288-39d1-4333-898d-12f0c4e073d4",
            "text":"Welche Staffel von Breaking Bad ist die Beste?",
            "type":"intRangeQuestion",
            "range":{
                "start":1,
                "endInclusive":5
            },
            "required":true,
            "description":null
        },
        {
            "id":"9f0a6fcb-484c-4e1f-bc0e-ea90456229f4",
            "text":"Wie viel Achievements hast Du bei Dark Souls?",
            "type":"percentQuestion",
            "required":false,
            "description":null
        },
        {
            "id":"cc65f1b2-950e-49eb-9137-fb8cf054be29",
            "text":"Wer ist der coolste hier?",
            "type":"enumQuestion",
            "values":[
                "Ich",
                "Immer noch ich?",
                "Nicht Du!"
            ],
            "required":true,
            "description":null
        },
        {
            "id":"20ec4653-e9fd-4032-bdbe-619f39b36c7c",
            "text":"Hier hast Du einen Euro, erzähl es deinem Frisör!",
            "type":"freeTextQuestion",
            "required":false,
            "description":"Scherz, schreib ruhig, was dich bewegt!"
        }
    ]
}

HTTP/1.1 200

# Post some details
POST http://localhost:8080/api/admin/concept-assignment/{{concept-assignment-id}}/details
{
    "details": {
        "buildingType": "GGW",
        "allowedFloors": 5,
        "allowedBuildingHeightMeters": 20,
        "energyText": "Lorem ipsum dolor sit amet, consectetur adipiscing elit."
    }
}

HTTP/1.1 200

# Start concept assignment
POST http://localhost:8080/api/admin/concept-assignment/{{concept-assignment-id}}/start
Cookie: vmp_auth: {{auth-cookie}}
{
    "startsAt": "2022-01-01T00:00:00.000Z",
    "endsAt": "2023-01-01T00:00:00.000Z"
}

HTTP/1.1 200

# Delete all mails to ensure first message is ours
DELETE http://localhost:8025/api/v1/messages
HTTP/1.1 200

# Trigger user creation
POST http://localhost:8080/api/user?conceptAssignmentId={{concept-assignment-id}}
{
    "accountType": "COMPANY",
    "company": "Dietenbach",
    "salutation": "HERR",
    "street": "Hauptstraße",
    "houseNumber": "1",
    "zipCode": "12345",
    "city": "Berlin",
    "firstName": "Max",
    "lastName": "Mustermann",
    "phoneNumber": "0123456789",
    "email": "{{user_email}}",
    "tosAndPrivacyPolicyConsent": true
}

HTTP/1.1 201

# Fetch mails and extract token from first message
GET http://localhost:8080/internal/mailhog/v1/messages
HTTP/1.1 200
Content-Type: application/json; charset=UTF-8

[Captures]
token: jsonpath "$[0].['Content'].['Body']" regex "http:\/\/localhost:8000\/protected\/invitation\/([a-zA-Z0-9]+)"

# Activate location admin with token from mail
POST http://localhost:8080/api/user/activate
{
    "password": "{{user_password}}",
    "token": "{{token}}"
}
HTTP/1.1 200

# Login as user
POST {{base_url}}/api/login
{
    "email": "{{user_email}}",
    "password": "{{user_password}}"
}
HTTP/1.1 200

[Captures]
auth-cookie: cookie "vmp_auth"

# Create candidature
POST http://localhost:8080/api/candidate/candidatures/{{concept-assignment-id}}

HTTP/1.1 201
