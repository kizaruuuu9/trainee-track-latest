@echo off
git commit -am "Fix partner registration: use business_type column instead of industry"
git pull origin main --rebase
git push origin main
echo Success.
