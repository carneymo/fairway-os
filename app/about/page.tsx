/* oxlint-disable nextjs/no-html-link-for-pages -- Native document navigation avoids the beta client router that left deployed links inert. */
import { Header, Footer } from '@/components/golf-shared';
export default function About() {
  return (
    <>
      <Header />
      <main className="shell about-page" id="main">
        <p className="eyebrow">GOLF IS A DAY YOU CHOOSE</p>
        <h1>
          A better day, before
          <br />
          the first tee.
        </h1>
        <p className="lead-copy">
          FairwayOS helps you decide when to play, where to go, and what to
          expect. Your golf day comes first.
        </p>
        <section>
          <h2>How we find a playing window</h2>
          <p>
            We look at hourly temperature, rain probability, wind, gusts, and
            daylight. A suggested 18-hole round needs 4½ hours before sunset; 9
            holes needs 2½ hours. These are planning assumptions, not
            pace-of-play guarantees.
          </p>
          <p>
            Snow, thunderstorms, freezing precipitation, very cold weather, and
            strong gusts exclude a window. Other conditions lower its ranking.
            Local conditions can change quickly: follow the course’s weather and
            safety instructions.
          </p>
          <p>
            Weather comes from{' '}
            <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
              Open-Meteo
            </a>
            , with a U.S. fallback from the{' '}
            <a href="https://www.weather.gov/" target="_blank" rel="noreferrer">
              National Weather Service
            </a>
            . The forecast names its source. For NWS forecasts, “Play until” is
            a conservative cutoff based on hourly daylight flags; it is not an
            exact sunset time. We interpret forecasts to suggest starts; we do
            not measure turf conditions or verify that a course is open.
            Forecasts are cached for up to 15 minutes.
          </p>
        </section>
        <section>
          <h2>Course information, with context</h2>
          <p>
            The initial Denver selection combines official course information
            with FairwayOS editorial descriptions. In other areas, discovery
            uses{' '}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noreferrer"
            >
              OpenStreetMap contributors
            </a>{' '}
            via Photon and Overpass. Open listings can be incomplete; a listed
            course is not necessarily open to visitors.
          </p>
          <p>
            Some official rate tables are refreshed automatically, at most once
            every six hours per active server instance. Other facts and notices
            show their review date. Published prices are guidance and may vary
            by day, season, residency, cart choice, and booking conditions.
          </p>
          <p>
            Course imagery is supplied FairwayOS design artwork and is
            illustrative. It should not be used to assess current course
            appearance or conditions. Open-data listings use a simple image-free
            treatment.
          </p>
        </section>
        <section>
          <h2>Booking stays with the course</h2>
          <p>
            Suggested playing windows are weather recommendations, not available
            tee times. Until a source provides verified inventory, we say to
            check with the course. We never turn a failed data request into
            “sold out.”
          </p>
          <p>
            The booking button opens the course’s own site. Your selected date,
            players, and round length stay visible in FairwayOS; enter them on
            the booking site. Nothing is booked or paid for in FairwayOS.
          </p>
        </section>
        <section>
          <h2>Your location and your choices</h2>
          <p>
            We use approximate IP location when our hosting service provides it,
            with Denver as the fallback. You can search for a place or
            explicitly share your device location. Coordinates are sent to our
            weather and course-data providers to find local results; raw IP
            addresses are not stored by the application.
          </p>
          <p>
            Your selected location and saved courses are stored in your browser
            on this device. They do not sync between devices. There is no
            account requirement, payment collection, or advertising tracker in
            this release.
          </p>
        </section>
        <a className="button" href="/">
          Find your next golf day
        </a>
      </main>
      <Footer />
    </>
  );
}
