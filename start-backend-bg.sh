#!/bin/bash

# 백엔드 백그라운드 실행 스크립트
cd backend
npm install
npm run build
npm start &
echo "백엔드 서버가 백그라운드에서 시작되었습니다. (http://localhost:8088)"
