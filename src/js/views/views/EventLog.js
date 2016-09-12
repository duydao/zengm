const React = require('react');
const bbgmViewReact = require('../../util/bbgmViewReact');
const {Dropdown, NewWindowLink, SafeHtml} = require('../components');

const EventLog = ({abbrev, events, season}) => {
    bbgmViewReact.title(`Event Log - ${season}`);

    return <div>
        <Dropdown view="event_log" fields={["teams", "seasons"]} values={[abbrev, season]} />
        <h1>Event Log <NewWindowLink /></h1>

        <ul>
            {events.map(e => <li key={e.eid}>
                <SafeHtml dirty={e.text} />
            </li>)}
        </ul>
    </div>;
};

EventLog.propTypes = {
    abbrev: React.PropTypes.string.isRequired,
    events: React.PropTypes.arrayOf(React.PropTypes.shape({
        eid: React.PropTypes.number.isRequired,
        text: React.PropTypes.string.isRequired,
    })).isRequired,
    season: React.PropTypes.number.isRequired,
};

module.exports = EventLog;
