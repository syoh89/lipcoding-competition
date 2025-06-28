#!/bin/bash

# 프론트엔드 백그라운드 실행 스크립트
cd frontend
npm install
npm run dev &
echo "프론트엔드 서버가 백그라운드에서 시작되었습니다. (http://localhost:3000)"
