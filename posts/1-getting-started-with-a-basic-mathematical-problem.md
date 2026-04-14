---
id: 1
title: "Getting started with a basic mathematical problem"
date: 2026-04-14
excerpt: "A simple discussion of a basic mathematical problem with rational numbers and irrational numbers"
coverImage: "../photo/v2-f29ba50e4174c24d1eba49d4da99dad7_r.jpg"
categories: ["Math"]
tags: ["Rational Numbers", "Numbers", "Mathematics", "beginner"]
---

When i was reading the book [Introduction to Calculus and Analysis I] written by Richard Courant, an interesting problem has caught my attention.
That is, how to prove that between any two rational numbers there is at least one irrational number which means that infinitely many.

Well, I studied EE not mathematics and I just read this book as a hobby so I really don't know how to prove this strictly using mathematical language, but I do recognize a thought that might be helpful for this problem. Maybe strictly provement of this problem requires strict mathematical theories but let's swtich our mind to a more computational point of view. That is using decimal numbers to prove this.

Any rational number can be represented by a finite decimal number or an infinitely repeating decimal number. If we follow this thought we could find that the problem can be turned into a combinational problem.Why? Choose two rational numbers, if they are all finite, then the result is obvious. They must be differing for more than $0.0\dots01$ , the dots means a finite number of 0s. As long As we choose the combination of numbers that's not repeating and which are smaller than the $0.0\dots01$ we mentioned before and add it(or minus it) on the smaller(or bigger) number we could get a irrational number between this two rational numbers. Well the combination for the numbers after the 1 is infinitely many so it comes automatically that there are infinitely many irrational numbers between this two rational numbers.

For other situations it's the same. Because they must differ from at least a number smaller enough that can be represented as $0.\dots01$. So after(smaller than) this number there are infinitely many combinations of numbers so it comes out that there are infinitely many irrational numbers between any two rational numbers. 

Hopefully this provement should work but as I said before, this requires some theories(I mean laws) to support this, like there are infinitely many non-repeating combinations of numbers.So it's just a thought rather than a provement.

<!-- cn -->

我在读科朗的《微积分与数学分析引论》时碰到了一个十分有趣的问题，就是怎么证明任意两个有理数中都有至少一个无理数，然后也即有无穷多个无理数。鉴于我非数学专业本科生，读这书只是爱好，所以我更多的是从思路上讨论这个问题。

我将这个问题转化为了一个组合学问题。

考虑任意两个有理数，因为有理数一定可以表示为有限小数或无限循环小数，所以先考虑两个有限小数的情形，任意两个有限小数一定在差值上要大于一个$0.0\dots01$，即一个足够小的零点零零零...零1，只要取比这个数小的数，然后让这个1右面的数组成一个无限不循环的组合，这样就是一个无理数了，然后只要这种无限不循环组合有无限多种，证明即成立，对于其他情况的有理数也是这样，只需要证明任意两个有理数都一定在差值上大于一个足够小的$0.0\dots01$，这个证明就能够成立，然后相信读者们也发现了，我刚才提到的这两个或许可称为定理的东西，全都是没有证明的（至少我不会），所以我个人也就无穷谈起这个问题的完整证明了，不过我将这个问题写在这里是因为我觉得这个思路还是个十分有意思的思路，将一个有理数与无理数的证明问题转化为一个组合学问题，我不知道数学系的同学会不会这么想，至少我是这么想的（也许源于我对组合学的喜爱，是的我极其喜欢组合学）。

这篇文章是我正式发的第一篇文章，虽然短小（因为一个这种问题也没法长篇大论），但是大概是反映了我考虑问题的思路吧，如果能将一个问题转化为组合学问题的话那何乐而不为呢，不过鉴于我曾经看过b站张秀平老师的组合数学，认识到即使在组合学里面也有许多（甚至是难度非常大的）悬而未决的问题，所以这种思路或许有用或许没用，但至少问题的转化其本身的确是一个有用的思路，仅仅将自己的思路记在这里。