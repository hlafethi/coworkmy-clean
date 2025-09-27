@echo off
echo Deploying Supabase functions...

echo Deploying create-payment-session...
npx supabase functions deploy create-payment-session

echo Deploying stripe-webhook...
npx supabase functions deploy stripe-webhook

echo Deployment complete!
pause 