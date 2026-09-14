# Work Directory

이 폴더는 코드가 아닌 업무 원본, 중간 작업물, 최종 보고 산출물을 모으는 공간이다.

## Structure

```text
00_inbox/          아직 분류하지 않은 자료
10_source-data/    원본 데이터, 발주서, 영업 데이터, Teams/녹음 자료
20_projects/       특정 업무 단위의 작업 파일
30_reports/        최종 보고서, 공유용 HTML/PDF/PPTX
90_archive/        완료되었거나 과거 구조에서 이관한 자료
```

## Rules

- 개발 소스는 `apps/`, `packages/`, `tools/`, `scripts/`에 둔다.
- 업무별 산출물은 `20_projects/YYYY-MM-DD_project-name/` 아래에 둔다.
- 프로젝트 폴더 안에서는 `input/`, `work/`, `final/`, `preview/`를 우선 사용한다.
- 대용량 원본 Excel, PDF, 녹음 파일은 git 추가 전 필요 여부를 확인한다.
