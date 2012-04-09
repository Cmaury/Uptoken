// queryutil.h

/**
*    Copyright (C) 2008 10gen Inc.
*
*    This program is free software: you can redistribute it and/or  modify
*    it under the terms of the GNU Affero General Public License, version 3,
*    as published by the Free Software Foundation.
*
*    This program is distributed in the hope that it will be useful,
*    but WITHOUT ANY WARRANTY; without even the implied warranty of
*    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*    GNU Affero General Public License for more details.
*
*    You should have received a copy of the GNU Affero General Public License
*    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

#pragma once

#include "jsobj.h"

namespace mongo {

    struct FieldBound {
        BSONElement bound_;
        bool inclusive_;
    };

    struct FieldInterval {
        FieldBound lower_;
        FieldBound upper_;
    };

    // range of a field's value that may be determined from query -- used to
    // determine index limits
    class FieldRange {
    public:
        FieldRange( const BSONElement &e = BSONObj().firstElement() , bool optimize=true );
        const FieldRange &operator&=( const FieldRange &other );
        BSONElement min() const { return interval_.lower_.bound_; }
        BSONElement max() const { return interval_.upper_.bound_; }
        bool minInclusive() const { return interval_.lower_.inclusive_; }
        bool maxInclusive() const { return interval_.upper_.inclusive_; }
        bool equality() const {
            return
                min().woCompare( max(), false ) == 0 &&
                maxInclusive() &&
                minInclusive();
        }
        bool nontrivial() const {
            return
                minKey.firstElement().woCompare( min(), false ) != 0 ||
                maxKey.firstElement().woCompare( max(), false ) != 0;
        }
    private:
        // towards replacing interval_ with a set of intervals
        BSONElement &lower() { return interval_.lower_.bound_; }
        BSONElement &upper() { return interval_.upper_.bound_; }
        bool &lowerInclusive() { return interval_.lower_.inclusive_; }
        bool &upperInclusive() { return interval_.upper_.inclusive_; }

        BSONObj addObj( const BSONObj &o );
        string simpleRegexEnd( string regex );
        FieldInterval interval_;
        vector< BSONObj > objData_;
    };
    
    // implements query pattern matching, used to determine if a query is
    // similar to an earlier query and should use the same plan
    class QueryPattern {
    public:
        friend class FieldRangeSet;
        enum Type {
            Equality,
            LowerBound,
            UpperBound,
            UpperAndLowerBound
        };
        // for testing only, speed unimportant
        bool operator==( const QueryPattern &other ) const {
            bool less = operator<( other );
            bool more = other.operator<( *this );
            assert( !( less && more ) );
            return !( less || more );
        }
        bool operator!=( const QueryPattern &other ) const {
            return !operator==( other );
        }
        bool operator<( const QueryPattern &other ) const {
            map< string, Type >::const_iterator i = fieldTypes_.begin();
            map< string, Type >::const_iterator j = other.fieldTypes_.begin();
            while( i != fieldTypes_.end() ) {
                if ( j == other.fieldTypes_.end() )
                    return false;
                if ( i->first < j->first )
                    return true;
                else if ( i->first > j->first )
                    return false;
                if ( i->second < j->second )
                    return true;
                else if ( i->second > j->second )
                    return false;
                ++i;
                ++j;
            }
            if ( j != other.fieldTypes_.end() )
                return true;
            return sort_.woCompare( other.sort_ ) < 0;
        }
    private:
        QueryPattern() {}
        void setSort( const BSONObj sort ) {
            sort_ = normalizeSort( sort );
        }
        BSONObj static normalizeSort( const BSONObj &spec ) {
            if ( spec.isEmpty() )
                return spec;
            int direction = ( spec.firstElement().number() >= 0 ) ? 1 : -1;
            BSONObjIterator i( spec );
            BSONObjBuilder b;
            while( i.moreWithEOO() ) {
                BSONElement e = i.next();
                if ( e.eoo() )
                    break;
                b.append( e.fieldName(), direction * ( ( e.number() >= 0 ) ? -1 : 1 ) );
            }
            return b.obj();
        }
        map< string, Type > fieldTypes_;
        BSONObj sort_;
    };
    
    // ranges of fields' value that may be determined from query -- used to
    // determine index limits
    class FieldRangeSet {
    public:
        FieldRangeSet( const char *ns, const BSONObj &query , bool optimize=true );
        const FieldRange &range( const char *fieldName ) const {
            map< string, FieldRange >::const_iterator f = ranges_.find( fieldName );
            if ( f == ranges_.end() )
                return trivialRange();
            return f->second;
        }
        int nNontrivialRanges() const {
            int count = 0;
            for( map< string, FieldRange >::const_iterator i = ranges_.begin(); i != ranges_.end(); ++i )
                if ( i->second.nontrivial() )
                    ++count;
            return count;
        }
        const char *ns() const { return ns_; }
        BSONObj query() const { return query_; }
        // if fields is specified, order fields of returned object to match those of 'fields'
        BSONObj simplifiedQuery( const BSONObj &fields = BSONObj() ) const;
        bool matchPossible() const {
            for( map< string, FieldRange >::const_iterator i = ranges_.begin(); i != ranges_.end(); ++i )
                if ( i->second.min().woCompare( i->second.max(), false ) > 0 )
                    return false;
            return true;
        }
        QueryPattern pattern( const BSONObj &sort = BSONObj() ) const;
    private:
        static FieldRange *trivialRange_;
        static FieldRange &trivialRange();
        mutable map< string, FieldRange > ranges_;
        const char *ns_;
        BSONObj query_;
    };

    /**
       used for doing field limiting
     */
    class FieldMatcher {
    public:
        
        void add( const BSONObj& o );
        int size() const;

        bool matches( const string& s ) const;
        void append( BSONObjBuilder& b , const BSONElement& e ) const;

        BSONObj getSpec() const;

    private:

        void extractDotted( const string& path , const BSONObj& o , BSONObjBuilder& b ) const ;
        
        multimap<string,string> fields; // { 'a' : 1 , 'b.c' : 1 } ==>> [ a -> '' , b -> c ]
    };


} // namespace mongo
