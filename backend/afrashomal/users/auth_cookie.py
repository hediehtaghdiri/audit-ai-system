from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.response import Response

class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        # بررسی هدر Authorization
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            raw_token = auth_header.split(' ')[1]
            validated_token = self.get_validated_token(raw_token)
            return self.get_user(validated_token), validated_token

        # بررسی کوکی access_token
        try:
            'access_token' in request.COOKIES
            print("Incoming cookies:", request.COOKIES['access_token'])
        except:
            print("No access token found")
            return Response({"error": "No access token"}, status=400)