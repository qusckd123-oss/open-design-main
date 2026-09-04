from pathlib import Path

OUT = Path(__file__).resolve().parent

FONT_KR = '"Noto Sans KR", "Malgun Gothic", Arial, sans-serif'
FONT_ROUND = '"Arial Rounded MT Bold", "Malgun Gothic", Arial, sans-serif'


def svg_wrap(body: str) -> str:
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1240" height="1240" viewBox="0 0 1240 1240">
  <defs>
    <style>
      .ink {{ fill: none; stroke: #111111; stroke-width: 8; stroke-linecap: round; stroke-linejoin: round; }}
      .thin {{ fill: none; stroke: #111111; stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; }}
      .blue {{ fill: none; stroke: #0b73a8; stroke-width: 7; stroke-linecap: round; stroke-linejoin: round; }}
      .green {{ fill: none; stroke: #5a8529; stroke-width: 7; stroke-linecap: round; stroke-linejoin: round; }}
      .tagText {{ font-family: {FONT_KR}; fill: #111111; text-anchor: middle; }}
      .latin {{ font-family: {FONT_ROUND}; font-weight: 800; letter-spacing: 3px; }}
    </style>
  </defs>
{body}
</svg>
'''


def tag_base(bg="#fff7e8", stroke="#ded7c8") -> str:
    return f'''
  <rect x="201" y="201" width="838" height="838" rx="62" transform="rotate(45 620 620)" fill="{bg}" stroke="{stroke}" stroke-width="2"/>
  <circle cx="620" cy="108" r="27" fill="#ffffff" stroke="#a9a9a9" stroke-width="2"/>
'''


def front_svg() -> str:
    body = tag_base() + r'''
  <g id="main-illustration" transform="translate(93 93) scale(0.85)">
  <g id="corn-bed">
    <path d="M276 765 C340 730 437 721 511 747 C438 802 340 810 276 765 Z" fill="#74a84b" stroke="#111" stroke-width="5"/>
    <path d="M958 765 C892 728 790 720 722 748 C790 802 899 810 958 765 Z" fill="#74a84b" stroke="#111" stroke-width="5"/>
    <path d="M276 765 C384 774 470 771 556 757" class="thin"/>
    <path d="M958 765 C844 774 766 771 684 758" class="thin"/>
    <ellipse cx="344" cy="786" rx="22" ry="13" fill="#ffd94a" stroke="#111" stroke-width="4"/>
    <ellipse cx="386" cy="800" rx="24" ry="14" fill="#ffd94a" stroke="#111" stroke-width="4"/>
    <ellipse cx="438" cy="793" rx="23" ry="13" fill="#ffd94a" stroke="#111" stroke-width="4"/>
    <ellipse cx="491" cy="804" rx="24" ry="14" fill="#ffd94a" stroke="#111" stroke-width="4"/>
    <ellipse cx="557" cy="807" rx="24" ry="14" fill="#ffd94a" stroke="#111" stroke-width="4"/>
    <ellipse cx="661" cy="807" rx="24" ry="14" fill="#ffd94a" stroke="#111" stroke-width="4"/>
    <ellipse cx="725" cy="802" rx="25" ry="14" fill="#ffd94a" stroke="#111" stroke-width="4"/>
    <ellipse cx="779" cy="792" rx="23" ry="13" fill="#ffd94a" stroke="#111" stroke-width="4"/>
    <ellipse cx="831" cy="802" rx="25" ry="14" fill="#ffd94a" stroke="#111" stroke-width="4"/>
    <ellipse cx="887" cy="787" rx="23" ry="13" fill="#ffd94a" stroke="#111" stroke-width="4"/>
    <g transform="translate(730 680) rotate(-7)">
      <ellipse cx="108" cy="56" rx="138" ry="38" fill="#ffcf35" stroke="#111" stroke-width="5"/>
      <path d="M-4 32 C68 1 161 -2 224 33" class="thin"/>
      <path d="M-12 56 C60 29 171 27 230 59" class="thin"/>
      <path d="M-2 79 C74 58 164 59 222 82" class="thin"/>
      <path d="M32 23 L32 91 M67 12 L67 100 M103 8 L103 104 M139 10 L139 101 M176 20 L176 93" class="thin"/>
    </g>
    <g transform="translate(324 704) rotate(8)">
      <ellipse cx="80" cy="44" rx="112" ry="30" fill="#ffcf35" stroke="#111" stroke-width="5"/>
      <path d="M-5 40 C45 20 127 20 164 42" class="thin"/>
      <path d="M21 18 L21 69 M55 11 L55 76 M89 10 L89 76 M123 16 L123 70" class="thin"/>
    </g>
  </g>
  <g id="character">
    <path d="M452 574 C481 541 528 526 577 529 L663 529 C713 526 760 541 788 574 L803 738 C741 793 503 793 437 738 Z" fill="#fff5df" stroke="#111" stroke-width="7"/>
    <path d="M466 593 C526 627 710 627 774 592" class="thin"/>
    <path d="M474 676 C548 697 690 699 765 677" class="thin"/>
    <path d="M547 538 C555 568 684 568 694 538" fill="#fff5df" stroke="#111" stroke-width="5"/>
    <path d="M561 541 L558 570 M582 546 L581 572 M604 548 L603 574 M626 548 L626 574 M648 547 L649 572 M670 542 L672 570" class="thin"/>
    <path d="M463 606 C420 596 361 622 350 668 C337 720 389 754 438 731 C489 707 507 636 463 606 Z" fill="#fff5df" stroke="#111" stroke-width="7"/>
    <path d="M777 606 C820 596 879 622 890 668 C903 720 851 754 802 731 C751 707 733 636 777 606 Z" fill="#fff5df" stroke="#111" stroke-width="7"/>
    <path d="M381 632 C396 652 412 675 425 719" class="thin"/>
    <path d="M858 632 C842 654 827 681 816 719" class="thin"/>
    <path d="M432 608 C413 582 369 590 362 623 C355 657 391 681 420 660 C441 646 449 628 432 608 Z" fill="#ffcf21" stroke="#111" stroke-width="7"/>
    <path d="M808 608 C827 582 871 590 878 623 C885 657 849 681 820 660 C799 646 791 628 808 608 Z" fill="#ffcf21" stroke="#111" stroke-width="7"/>
    <path d="M411 611 C426 620 432 638 421 654" class="thin"/>
    <path d="M829 611 C814 620 808 638 819 654" class="thin"/>
    <path d="M546 740 C500 736 471 772 483 815 C494 856 548 872 585 843 C617 816 602 747 546 740 Z" fill="#ffcf21" stroke="#111" stroke-width="7"/>
    <path d="M694 740 C740 736 769 772 757 815 C746 856 692 872 655 843 C623 816 638 747 694 740 Z" fill="#ffcf21" stroke="#111" stroke-width="7"/>
    <path d="M477 373 C500 341 552 351 562 390 C581 368 621 373 631 405 C657 386 701 396 710 430 C724 479 681 507 634 496 L559 496 C503 510 452 489 455 432 C423 430 407 397 426 375 C441 356 463 358 477 373 Z" fill="#fff7e8" stroke="#111" stroke-width="7"/>
    <path d="M520 457 C559 484 631 488 673 460" fill="none" stroke="#b8d5e9" stroke-width="12" stroke-linecap="round"/>
    <path d="M535 466 C579 493 626 493 662 466" class="thin"/>
    <path d="M568 481 C602 493 634 488 657 471" class="thin"/>
    <path d="M543 432 C574 458 628 459 662 438" class="thin"/>
    <path d="M529 375 C535 348 560 327 592 329 L642 329 C680 328 707 350 716 385 C758 373 792 399 796 432 C804 494 736 521 694 480 C676 507 637 519 605 500 C580 517 534 513 515 483 C476 501 435 481 434 439 C433 397 467 372 505 385 C509 380 516 376 529 375 Z" fill="#ffcf21" stroke="#111" stroke-width="8"/>
    <circle cx="587" cy="443" r="9" fill="#111"/>
    <circle cx="650" cy="443" r="9" fill="#111"/>
    <path d="M584 478 C604 504 643 504 663 478" class="ink"/>
  </g>
  </g>
  <g id="clouds">
    <path d="M707 238 C727 206 776 210 785 250 C822 246 849 273 841 309 C834 343 791 353 768 329 C744 347 703 339 692 308 C665 306 649 279 662 256 C671 241 687 235 707 238 Z" fill="#fff7e8" stroke="#111" stroke-width="6"/>
    <path d="M771 308 C789 321 819 313 828 291" fill="none" stroke="#b8d5e9" stroke-width="9" stroke-linecap="round"/>
    <path d="M399 663 C409 635 449 639 455 670 C485 674 500 707 476 730 C454 751 421 739 415 712 C388 708 377 681 399 663 Z" fill="#fff7e8" stroke="#111" stroke-width="6"/>
    <path d="M414 719 C434 731 461 723 472 703" fill="none" stroke="#b8d5e9" stroke-width="8" stroke-linecap="round"/>
    <path d="M286 680 C298 653 334 658 339 687 C366 690 381 720 359 740 C338 759 310 747 304 723 C280 721 270 699 286 680 Z" fill="#fff7e8" stroke="#111" stroke-width="6"/>
    <path d="M294 731 C313 741 338 734 351 714" fill="none" stroke="#b8d5e9" stroke-width="8" stroke-linecap="round"/>
    <path d="M841 415 C854 390 889 394 895 421 C923 422 939 450 918 472 C898 493 870 482 863 459 C839 456 829 434 841 415 Z" fill="#fff7e8" stroke="#111" stroke-width="6"/>
    <circle cx="920" cy="344" r="13" fill="#fff7e8" stroke="#111" stroke-width="6"/>
    <circle cx="953" cy="304" r="12" fill="#fff7e8" stroke="#111" stroke-width="6"/>
  </g>
  <g id="claim-text">
    <text x="308" y="428" class="tagText latin" font-size="38" fill="#5a8529" text-anchor="middle">
      <tspan x="308" dy="0">PLANT-</tspan>
      <tspan x="308" dy="45">BASED</tspan>
    </text>
    <path d="M259 367 C279 326 320 326 341 367" class="green"/>
    <path d="M285 360 C262 334 262 305 288 288 C314 311 313 339 285 360 Z" fill="#fff7e8" stroke="#5a8529" stroke-width="6"/>
    <path d="M318 360 C340 333 340 305 314 288 C289 310 290 339 318 360 Z" fill="#fff7e8" stroke="#5a8529" stroke-width="6"/>
    <path d="M256 471 C272 459 297 455 318 458" class="blue"/>
    <path d="M266 496 C287 480 318 476 342 481" class="blue"/>
    <text x="930" y="474" class="tagText latin" font-size="40" fill="#0b73a8">SOFT</text>
    <g transform="translate(0 -58)">
      <path d="M857 438 C871 410 909 414 917 442 C945 443 959 471 938 491 C916 512 889 499 885 474 C858 470 847 452 857 438 Z" fill="#fff7e8" stroke="#0b73a8" stroke-width="6"/>
    </g>
    <path d="M854 515 C885 526 932 525 963 511" class="blue"/>
    <text x="620" y="992" class="tagText latin" font-size="38" fill="#0b73a8">• COMFORT STRETCH •</text>
    <path d="M552 1038 C594 1027 647 1027 688 1038" fill="none" stroke="#ffd21f" stroke-width="7" stroke-linecap="round"/>
    <path d="M540 1068 C566 1051 591 1083 616 1066 C642 1048 665 1084 695 1067" class="blue"/>
  </g>
'''
    return svg_wrap(body)


def back_svg() -> str:
    body = tag_base() + r'''
  <g id="benefits" transform="translate(0 8)">
    <g transform="translate(286 432)">
      <path d="M34 94 C20 72 25 45 45 42 C50 20 78 15 92 34 C112 24 136 37 136 63 L136 124 C136 166 101 196 61 180 C39 171 27 153 19 131 L-4 72 C-10 55 9 43 23 57 L49 87" fill="#fff7e8" stroke="#111" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M50 40 L50 112 M78 32 L78 117 M106 44 L106 118" class="thin"/>
      <path d="M18 26 C55 25 72 52 68 87 C33 86 14 62 18 26 Z" fill="#b7d76b" stroke="#111" stroke-width="5"/>
      <path d="M22 30 L66 83" class="thin"/>
      <path d="M96 110 C111 90 139 91 148 112 C137 137 111 146 96 110 Z" fill="#b7d76b" stroke="#111" stroke-width="5"/>
    </g>
    <g transform="translate(612 420)">
      <path d="M0 26 L0 120" class="ink"/>
      <path d="M0 26 L-18 48 M0 26 L18 48" class="ink"/>
      <path d="M-66 88 L-3 88 M66 88 L3 88" class="ink"/>
      <path d="M-66 88 L-44 66 M-66 88 L-44 110 M66 88 L44 66 M66 88 L44 110" class="ink"/>
      <path d="M-36 136 C-48 96 48 96 36 136 C24 173 -24 173 -36 136 Z" fill="#fff7e8" stroke="#111" stroke-width="6"/>
      <path d="M-68 168 L68 168 M-68 168 L-45 148 M-68 168 L-45 188 M68 168 L45 148 M68 168 L45 188" class="thin"/>
      <path d="M-33 129 C-18 151 18 151 33 129" class="thin"/>
      <path d="M-20 122 C-10 139 10 139 20 122" class="thin"/>
    </g>
    <g transform="translate(900 443)">
      <path d="M-62 93 C-18 112 26 111 73 91" class="thin"/>
      <path d="M-77 130 C-31 145 19 146 62 127" class="thin"/>
      <path d="M-13 45 C25 10 72 6 83 24 C93 40 75 64 41 80 C15 92 -13 92 -43 84" fill="#fff7e8" stroke="#111" stroke-width="6"/>
      <path d="M-43 84 C-15 69 16 53 42 29" class="thin"/>
      <path d="M18 52 C40 55 59 47 73 30" class="thin"/>
      <path d="M-11 75 C5 83 24 82 42 76" class="thin"/>
      <path d="M-51 137 C-21 116 17 114 51 131 C33 153 0 167 -51 137 Z" fill="#fff7e8" stroke="#111" stroke-width="6"/>
      <path d="M-119 161 C-65 174 -23 177 44 161" class="thin"/>
    </g>
    <line x1="522" y1="568" x2="522" y2="762" stroke="#6aa151" stroke-width="5"/>
    <line x1="782" y1="568" x2="782" y2="762" stroke="#6aa151" stroke-width="5"/>
    <text x="340" y="720" class="tagText" font-size="38" font-weight="800">식물 유래 성분</text>
    <text x="340" y="770" class="tagText" font-size="23" font-weight="600">옥수수 유래 성분 일부 적용</text>
    <text x="653" y="720" class="tagText" font-size="38" font-weight="800">편안한 신축성</text>
    <text x="653" y="770" class="tagText" font-size="23" font-weight="600">우수한 복원력</text>
    <text x="936" y="720" class="tagText" font-size="38" font-weight="800">부드러운 촉감</text>
    <text x="936" y="770" class="tagText" font-size="23" font-weight="600">소프트한 터치감</text>
    <text x="620" y="1024" class="tagText" font-size="18" font-family="Georgia, serif" font-weight="700">© COPYRIGHT WACKYWILLY</text>
  </g>
'''
    return svg_wrap(body)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "sorona-tag-front-clean-vector.svg").write_text(front_svg(), encoding="utf-8")
    (OUT / "sorona-tag-back-clean-vector.svg").write_text(back_svg(), encoding="utf-8")


if __name__ == "__main__":
    main()
