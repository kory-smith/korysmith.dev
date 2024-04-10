---
title: Making My Website
description: All the things that are cool about korysmith.dev.
publishedDate: 2023-11-03
status: published
---

<!-- Below works with MDX -->
<!-- published on {frontmatter.publishedDate} -->

I made a website! This one! It’s not the first time I’ve had a website, but it is the first time I’ve had a website that I’m proud of and that’s mostly original.

You’ll note that I said _mostly_ original. I got the design from [Andy Bell’s site](https://andy-bell.co.uk/). At first, I did this with glee—we programmers “borrow” code all the time, right? Then, I read this on his blog.

> The only thing that doesn’t feel safe is that the fellas (it’s always the fellas) love to rip off other peoples websites, which **is absolutely not cool**. The power play I have for that is no one is gonna want a site that looks like mine lmao.

Whoops. Sorry, Andy. Maybe I can say it was _inspired by_ Andy Bell?

Anyway, to celebrate the launching of the website, I wanted to write an article _about_ the website.

## What’s cool about your website, Kory?

I’m glad you asked.

### It uses Notion as a CMS

Almost all of the content for the site lives in a Notion database. The Notion content gets transformed into HTML with a roughshod transpiler I wrote myself!

The coolest part is that it handles images too. The transpiler uses [sharp](https://sharp.pixelplumbing.com/) to create an avif, webp, and jpeg of each image and serves them up in a `picture` component. Sharp also optimizes the images to 50% quality. That part could use some tweaking—I bet I can get even smaller filesizes without a noticeable decrease in quality.

Other things the Notion parser does:

- Adds # links (called [fragment identifiers](https://www.w3.org/DesignIssues/Fragment.html)) to headers
- Adds a “date published” and “last edited date” to articles
- Adds rel=external to all external links

### It only ships the font characters that appears on the site

I use [glyphhanger](https://github.com/filamentgroup/glyphhanger) to subset fonts. Subsetting is the process of stripping out unused characters from a font file.

For example, if I never use the “g” character, it won’t be included in the font file that’s shipped to your browser. You can see this in action if you inspect the fonts that load on the site. As of the publish date, I don’t use the capital D character, so it’s not included in the font file. You can tell because most of the characters don’t have serifs, but the D does.

![example of font subsetting](/public/images/subsetting.png)

Right now, I have to run the subset command manually. There’s a plugin that does this automatically—[Subfont](https://github.com/Ernxst/subfont)—but it has a bug where it doesn’t work in Cloudflare Pages, which is where I host the site.

**Update 11/11/2023:** I switched to using system fonts picked out by [https://modernfontstacks.com/](https://modernfontstacks.com/) because my monkey brain couldn’t stop saying “but do you _need_ those extra 16 kB of fonts?”

### It will never ever have CLS

I despise CLS. I especially dislike CLS caused by webfont swapping. So, my webfonts are marked as optional. If they’ve loaded when the page loads, you’ll get them. If not, you’ll just get your system font.

And of course, I always reserve the proper space for my images.

**Update 11/11/2023:** There still won’t be CLS, but now there are no webfonts to speak of.

### It’s built with [Astro](https://astro.build/)

I had an old version of the site running Remix and using the [Speed Metal stack](https://github.com/Girish21/speed-metal-stack). It had a lot of stuff—even a database!

I love Remix, and my personal website was going to be my way of exploring it further.

It was around the time I made the Remix site that I joined Kroger’s web performance team. On the performance team, I came to understand just how expensive JavaScript is. JavaScript is, per byte, the most expensive type of content you can add to a site. It has a triple cost:

1. First, you have to download it
2. Then, you have to parse it and turn it into machine code
3. Then, you have to run it

I quickly realized that there was no need to serve several hundred kB of JS just for a blog (_especially_ not for a blog).

Around the same time, I started to get interested in websites that focused heavily on simplicity—[Pinboard](https://pinboard.in/), for example. Astro was the new hotness at the time, so I decided to give that a try. It was also my excuse to learn about static-site generation (SSG) as opposed to the server-side rendering (SSR) I was more used to.

I ended up quite liking Astro. I especially like Astro’s focus on simplicity and performance (notice a theme?)

Of course, if I had done all this 5 years earlier, I would likely be just as smitten with [11ty](https://www.11ty.dev/). Static site generators are neat.

### It has prefetching

Astro has a prefetch integration that wasn’t customizable enough for my wants. I really liked Remix’s prefetch-intent option—where a link got prefetched only when you interacted with it—[so I added it myself](https://github.com/withastro/astro/pull/6585)!

Now, if you hover over any of my navigation links, the browser will prefetch all relevant code.

I have some plans in the future to upgrade the prefetching. Chrome now has a prefetch API called [SpeculationRules](https://developer.chrome.com/blog/prerender-pages/). I plan to upgrade the site soon to use SpeculationRules if I detect a Chrome browser, and to keep using fetch if not.

This prefetching is also the only part of the site that uses JavaScript.

I know that a static-generated website is plenty performant on its own, but I get a lot of joy from squeezing the site to as small as it can get.

**Update 11/11/2023:** The Astro prefetch integration that I worked on got deprecated, but the prefetch functionality (including the hover prefetch) got added to Astro Core. I’m sure they were planning this before I went in and added hover prefetching, but I’m still counting this as a win for me!

### It’s open source

You can see all the code for the site [here](https://github.com/kory-smith/korysmith.dev), if you want.

### It has a webhook endpoint

Right now, I’m using the site as glue for a neat little integration I have. Whenever I create a new project in Todoist, it creates a corresponding page in Notion and links the Notion page back to Todoist. It’s handy because I use Todoist for tasks and Notion for notes.

The integration works by sending a webhook to my site, which validates that the request really came from Todoist, adds the proper authorization headers, and dispatches a POST request to GitHub actions to run the integration.

At first, I tried having Todoist just send the POST straight to Github, but Todoist didn’t allow me to set the proper authentication headers, so I needed a middleman.

Note: As of publishing, this integration isn’t working—probably as a result of Astro not recognizing what content I want to be on the /webhooks/peat route. I could fix it pretty easily (I think), but I’ve been considering moving the code to [val.town](http://val.town), since there’s no reason it has to be on my website, and Cloudflare only gives me 10ms of CPU time per request, which I’m afraid I’ll go over if I start doing anything async. (I’m not sure if waiting on network stuff counts as CPU time, though)

**Update 11/09/2023:** I fixed it! It took an hour, but [I had mistakenly placed the code for /webhooks/peat in a functions folder instead of the pages directory where it belonged](https://github.com/kory-smith/korysmith.dev/commit/bd05c41ba905675a4ed532e8eec88f7d106cd6d1). I also had to do some environment variable finagling.

### It has a dark/light mode favicon

In creating the website, I learned that favicons can have media queries. So, my website has a light-mode favicon and a dark-mode favicon. I love it.

![dark and light mode favicons](/public/images/dark-light-favicon.png)

### It lazy loads images

If you visit a page with images that are below the fold (such as [https://korysmith.dev/uses/](https://korysmith.dev/uses/)), the images won’t load until you’re about to scroll them into view. [This is a native web feature](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/loading).

### It has a staging site

[https://stage.korysmith.dev/](https://stage.korysmith.dev/) exists and updates whenever I push changes to my `stage` branch.

## Summing up

Building this website was a ton of fun, and taught me a lot about building for the web in ways I wouldn’t have experienced otherwise. My day job is to work on a big React site, so I don’t often get to work on such a small, lean codebase.

This website and article also signal my decision to [enter the arena](https://www.goodreads.com/quotes/7-it-is-not-the-critic-who-counts-not-the-man). For a long time, I have wanted to be someone who makes things—who puts himself and his ideals out there for the world to see and engage with. Now, I have begun.
